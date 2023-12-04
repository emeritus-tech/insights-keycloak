<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
      ${msg("loginAccountTitle")}
    <#elseif section = "form">
        <div id="kc-form">
          <div id="kc-form-wrapper">
            <#if realm.password>
                <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                    <#if !usernameHidden??>
                        <div class="${properties.kcFormGroupClass!}">
                            <label for="username" class="${properties.kcLabelClass!}"><#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if></label>

                            <input tabindex="1" id="username" class="${properties.kcInputClass!}" name="username" value="${(login.username!'')}"  type="text" autofocus autocomplete="off"
                                   aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
                            />

                            <#if messagesPerField.existsError('username','password')>
                                <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                        ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                                </span>
                            </#if>

                        </div>
                    </#if>

                    <div class="${properties.kcFormGroupClass!}">
                        <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>

                        <div class="${properties.kcInputGroup!}">
                            <input tabindex="2" id="password" class="${properties.kcInputClass!}" name="password" type="password" autocomplete="off"
                                   aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
                            />
                            <button class="pf-c-button pf-m-control" type="button" aria-label="${msg("showPassword")}"
                                    aria-controls="password"  data-password-toggle
                                    data-label-show="${msg('showPassword')}" data-label-hide="${msg('hidePassword')}">
                                <i class="fa fa-eye" aria-hidden="true"></i>
                            </button>
                        </div>

                        <#if usernameHidden?? && messagesPerField.existsError('username','password')>
                            <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                            </span>
                        </#if>

                    </div>

                    <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
                        <div id="kc-form-options">
                            <#if realm.rememberMe && !usernameHidden??>
                                <div class="checkbox">
                                    <label>
                                        <#if login.rememberMe??>
                                            <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" checked> ${msg("rememberMe")}
                                        <#else>
                                            <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox"> ${msg("rememberMe")}
                                        </#if>
                                    </label>
                                </div>
                            </#if>
                            </div>
                            <div class="${properties.kcFormOptionsWrapperClass!}">
                                <#if realm.resetPasswordAllowed>
                                    <span><a tabindex="5" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a></span>
                                </#if>
                            </div>

                      </div>

                      <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}">
                          <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                          <input tabindex="4" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" name="login" id="kc-login" type="submit" value="${msg("doLogIn")}"/>
                      </div>
                </form>
            </#if>
            </div>
        </div>
        <script type="module" src="${url.resourcesPath}/js/passwordVisibility.js"></script>
    <#elseif section = "info" >
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration-container">
                <div id="kc-registration">
                    <span>${msg("noAccount")} <a tabindex="6"
                                                 href="${url.registrationUrl}">${msg("doRegister")}</a></span>
                </div>
            </div>
        </#if>
    <#elseif section = "socialProviders" >
        <#if realm.password && social.providers??>
            <div id="kc-social-providers" class="${properties.kcFormSocialAccountSectionClass!}">
                <hr/>
                <h4>${msg("identity-provider-login-label")}</h4>

                <ul class="${properties.kcFormSocialAccountListClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountListGridClass!}</#if>">
                    <#list social.providers as p>
                        <li>
                            <a id="social-${p.alias}" class="${properties.kcFormSocialAccountListButtonClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountGridItem!}</#if>"
                                    type="button" href="${p.loginUrl}">
                                <#if p.iconClasses?has_content>
                                    <i class="${properties.kcCommonLogoIdP!} ${p.iconClasses!}" aria-hidden="true"></i>
                                    <span class="${properties.kcFormSocialAccountNameClass!} kc-social-icon-text">${p.displayName!}</span>
                                <#else>
                                    <span class="${properties.kcFormSocialAccountNameClass!}">${p.displayName!}</span>
                                </#if>
                            </a>
                        </li>
                    </#list>
                </ul>
            </div>
        </#if>
    </#if>

</@layout.registrationLayout>
    <style scoped>
        .kc-login-footer {
            background: #fff;
            padding: 10px 20px !important;
            max-width: 856px;
            margin: 10px auto;
            border-radius: 4px;
            text-align: left;
            @media (max-width: 767px) {
                margin-left: 16px !important;
                margin-right: 16px !important;
                margin-bottom: 24px;
            }
        }

        .kc-login-footer-text {
            color: #444444;
            font-size: 14px;
            font-weight: 400;
            line-height: 160%;
            padding-left: 10px;
        }

        .kc-login-footer-notice {
            color: #444444;
            font-size: 14px;
            font-weight: 500;
            line-height: 140%;
            margin-bottom: 10px;
            margin-top: 10px;
        }

        .kc-login-footer-steps-label {
            color: #222222;
            font-size: 14px;
            font-weight: 400;
            line-height: 160%;
            margin-bottom: 5px;
        }

        #overlayModal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            justify-content: center;
            align-items: center;
            z-index: 1;
        }

        .modal-content {
            background: #f8f8fa;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            text-align: center;
            max-width: fit-content;
            width: 100%;
        }

        .modal-content h2 {
            color: #1f7ead;
            margin-top: unset;
        }

        .my-10 {
            margin: 1rem 0;
        }

        .close-btn {
            position: absolute;
            top: 2px;
            right: 10px;
            height: 40px;
            width: 40px;
            font-size: 24px;
            cursor: pointer;
        }
        /* Media query for smaller screens */
        @media only screen and (max-width: 600px) {
            .modal-content {
                max-width: 94%;
            }

            .kc-login-footer-notice {
                margin-bottom: 11px;
                margin-top: 0px;
            }

            .modal-content h2 {
                margin-top: 10px;
            }

            .kc-login-footer {
                max-height: 60vh;
                overflow: auto; 
            }

        }
    </style>
    <div id="overlayModal">
        <div class="modal-content">
            <span class="close-btn" id="closeModalBtn">&times;</span>
            <h2>Important Notice</h2>
            <div class="kc-login-footer">
                <div class="kc-login-footer-notice">We have recently made some changes to our login system, and your current password is no longer valid. To protect your account, we kindly request that you reset your password.</div>
                <div class="kc-login-footer-notice">This is a one-time action, and you will not need to reset your password again unless you forget it. Once you have successfully reset your password, you will be able to log in using your new password.</div>
                <div class="kc-login-footer-steps-label">To reset your password, follow these simple steps:</div>
                <div class="kc-login-footer-text">1. Click on the "Forgot Password" link below the login form.</div>
                <div class="kc-login-footer-text">2. Enter your registered email address and click on the "Reset Password" button.</div>
                <div class="kc-login-footer-text">3. Check your email inbox for a password reset message from us.</div>
                <div class="kc-login-footer-text">4. Click on the link provided in the email to proceed with the password reset process.</div>
                <div class="kc-login-footer-text">5. Create a new strong password and confirm it.</div>
                <div class="kc-login-footer-text">6. Click on the "Reset Password" button to finalize the process.</div>
                </div>
            </div>
        </div>
    </div>
   

