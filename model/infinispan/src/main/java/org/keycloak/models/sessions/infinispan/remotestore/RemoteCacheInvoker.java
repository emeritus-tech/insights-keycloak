/*
 * Copyright 2016 Red Hat, Inc. and/or its affiliates
 * and other contributors as indicated by the @author tags.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.keycloak.models.sessions.infinispan.remotestore;

import org.infinispan.client.hotrod.exceptions.HotRodClientException;
import org.keycloak.common.Profile;
import org.keycloak.common.util.Retry;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import org.infinispan.client.hotrod.Flag;
import org.infinispan.client.hotrod.RemoteCache;
import org.infinispan.client.hotrod.VersionedValue;
import org.jboss.logging.Logger;
import org.keycloak.connections.infinispan.TopologyInfo;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.sessions.infinispan.changes.MergedUpdate;
import org.keycloak.models.sessions.infinispan.changes.SessionEntityWrapper;
import org.keycloak.models.sessions.infinispan.changes.SessionUpdateTask;
import org.keycloak.models.sessions.infinispan.entities.SessionEntity;
import org.keycloak.connections.infinispan.InfinispanUtil;

import static org.keycloak.connections.infinispan.InfinispanConnectionProvider.CLIENT_SESSION_CACHE_NAME;
import static org.keycloak.connections.infinispan.InfinispanConnectionProvider.OFFLINE_CLIENT_SESSION_CACHE_NAME;
import static org.keycloak.connections.infinispan.InfinispanConnectionProvider.OFFLINE_USER_SESSION_CACHE_NAME;
import static org.keycloak.connections.infinispan.InfinispanConnectionProvider.USER_SESSION_CACHE_NAME;

/**
 * @author <a href="mailto:mposolda@redhat.com">Marek Posolda</a>
 */
public class RemoteCacheInvoker {

    public static final Logger logger = Logger.getLogger(RemoteCacheInvoker.class);

    private final Map<String, RemoteCache> remoteCaches =  new HashMap<>();


    public void addRemoteCache(String cacheName, RemoteCache remoteCache) {
        remoteCaches.put(cacheName, remoteCache);
    }

    public Set<String> getRemoteCacheNames() {
        return Collections.unmodifiableSet(remoteCaches.keySet());
    }


    public <K, V extends SessionEntity> void runTask(KeycloakSession kcSession, RealmModel realm, String cacheName, K key, MergedUpdate<V> task, SessionEntityWrapper<V> sessionWrapper) {
        RemoteCache remoteCache = remoteCaches.get(cacheName);
        if (remoteCache == null) {
            return;
        }

        SessionUpdateTask.CacheOperation operation = task.getOperation();
        SessionUpdateTask.CrossDCMessageStatus status = task.getCrossDCMessageStatus(sessionWrapper);

        if (status == SessionUpdateTask.CrossDCMessageStatus.NOT_NEEDED) {
            if (logger.isTraceEnabled()) {
                logger.tracef("Skip writing to remoteCache for entity '%s' of cache '%s' and operation '%s'", key, cacheName, operation);
            }
            return;
        }

        long maxIdleTimeMs = getMaxIdleTimeMs(task);

        if (logger.isTraceEnabled()) {
            logger.tracef("Running task '%s' on remote cache '%s' . Key is '%s'", operation, cacheName, key);
        }

        TopologyInfo topology = InfinispanUtil.getTopologyInfo(kcSession);

        Retry.executeWithBackoff((int iteration) -> {

            try {
                runOnRemoteCache(topology, remoteCache, maxIdleTimeMs, key, task, sessionWrapper);
            } catch (HotRodClientException re) {
                if (logger.isDebugEnabled()) {
                    logger.debugf(re, "Failed running task '%s' on remote cache '%s' . Key: '%s', iteration '%s'. Will try to retry the task",
                            operation, cacheName, key, iteration);
                }

                // Rethrow the exception. Retry will take care of handle the exception and eventually retry the operation.
                throw re;
            }

        }, 10, 10);
    }

    private static <V extends SessionEntity> long getMaxIdleTimeMs(MergedUpdate<V> task) {
        long maxIdleTimeMs = task.getMaxIdleTimeMs();
        if (maxIdleTimeMs > 0) {
            // Increase the timeout to ensure that entry won't expire on remoteCache in case that write of some entities to remoteCache is postponed (eg. userSession.lastSessionRefresh)
            maxIdleTimeMs += 1800000;
        }
        return maxIdleTimeMs;
    }

    private <K, V extends SessionEntity> void runOnRemoteCache(TopologyInfo topology, RemoteCache<K, SessionEntityWrapper<V>> remoteCache, long maxIdleMs, K key, MergedUpdate<V> task, SessionEntityWrapper<V> sessionWrapper) {
        SessionUpdateTask.CacheOperation operation = task.getOperation();

        switch (operation) {
            case REMOVE:
                remoteCache.remove(key);
                break;
            case ADD:
                remoteCache.put(key, sessionWrapper.forTransport(),
                        InfinispanUtil.toHotrodTimeMs(remoteCache, task.getLifespanMs()), TimeUnit.MILLISECONDS,
                        InfinispanUtil.toHotrodTimeMs(remoteCache, maxIdleMs), TimeUnit.MILLISECONDS);
                break;
            case ADD_IF_ABSENT:
                SessionEntityWrapper<V> existing = remoteCache
                        .withFlags(Flag.FORCE_RETURN_VALUE)
                        .putIfAbsent(key, sessionWrapper.forTransport(), InfinispanUtil.toHotrodTimeMs(remoteCache, task.getLifespanMs()), TimeUnit.MILLISECONDS, InfinispanUtil.toHotrodTimeMs(remoteCache, maxIdleMs), TimeUnit.MILLISECONDS);
                if (existing != null) {
                    logger.debugf("Existing entity in remote cache for key: %s . Will update it", key);

                    replace(topology, remoteCache, task.getLifespanMs(), maxIdleMs, key, task);
                }
                break;
            case REPLACE:
                replace(topology, remoteCache, task.getLifespanMs(), maxIdleMs, key, task);
                break;
            default:
                throw new IllegalStateException("Unsupported state " +  operation);
        }
    }


    private <K, V extends SessionEntity> void replace(TopologyInfo topology, RemoteCache<K, SessionEntityWrapper<V>> remoteCache, long lifespanMs, long maxIdleMs, K key, SessionUpdateTask<V> task) {
        // Adjust based on the hotrod protocol
        lifespanMs = InfinispanUtil.toHotrodTimeMs(remoteCache, lifespanMs);
        maxIdleMs = InfinispanUtil.toHotrodTimeMs(remoteCache, maxIdleMs);

        boolean replaced = false;
        int replaceIteration = 0;
        while (!replaced && replaceIteration < InfinispanUtil.MAXIMUM_REPLACE_RETRIES) {
            replaceIteration++;

            VersionedValue<SessionEntityWrapper<V>> versioned = remoteCache.getWithMetadata(key);
            if (versioned == null) {
                if (Profile.isFeatureEnabled(Profile.Feature.PERSISTENT_USER_SESSIONS) &&
                    (remoteCache.getName().equals(USER_SESSION_CACHE_NAME)
                     || remoteCache.getName().equals(CLIENT_SESSION_CACHE_NAME)
                     || remoteCache.getName().equals(OFFLINE_USER_SESSION_CACHE_NAME)
                     || remoteCache.getName().equals(OFFLINE_CLIENT_SESSION_CACHE_NAME))) {
                    logger.debugf("No existing entry for %s in the remote cache to remove, might have been evicted. A delete will force an eviction in the other DC.", key);
                    remoteCache.remove(key);
                }
                logger.warnf("Not found entity to replace for key '%s'", key);
                return;
            }

            SessionEntityWrapper<V> sessionWrapper = versioned.getValue();
            final V session = sessionWrapper.getEntity();

            // Run task on the remote session
            task.runUpdate(session);

            if (logger.isTraceEnabled()) {
                logger.tracef("%s: Before replaceWithVersion. Entity to write version %d: %s", logTopologyData(topology, replaceIteration),
                        versioned.getVersion(), session);
            }

            replaced = remoteCache.replaceWithVersion(key, SessionEntityWrapper.forTransport(session), versioned.getVersion(), lifespanMs, TimeUnit.MILLISECONDS, maxIdleMs, TimeUnit.MILLISECONDS);

            if (!replaced) {
                logger.debugf("%s: Failed to replace entity '%s' version %d. Will retry again", logTopologyData(topology, replaceIteration), key, versioned.getVersion());
            } else {
                if (logger.isTraceEnabled()) {
                    logger.tracef("%s: Replaced entity version %d in remote cache: %s", logTopologyData(topology, replaceIteration), versioned.getVersion(), session);
                }
            }
        }

        if (!replaced) {
            logger.warnf("Failed to replace entity '%s' in remote cache '%s'", key, remoteCache.getName());
        }
    }


    private String logTopologyData(TopologyInfo topology, int iteration) {
        return topology.toString() + ", replaceIteration: " + iteration;
    }
}
