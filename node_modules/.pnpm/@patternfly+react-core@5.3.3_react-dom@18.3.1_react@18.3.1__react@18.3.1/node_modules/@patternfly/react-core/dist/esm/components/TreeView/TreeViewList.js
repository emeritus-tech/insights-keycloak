import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import { Divider } from '../Divider';
import styles from '@patternfly/react-styles/css/components/TreeView/tree-view.mjs';
export const TreeViewList = (_a) => {
    var { isNested = false, toolbar, children } = _a, props = __rest(_a, ["isNested", "toolbar", "children"]);
    return (React.createElement(React.Fragment, null,
        toolbar && (React.createElement(React.Fragment, null,
            toolbar,
            React.createElement(Divider, null))),
        React.createElement("ul", Object.assign({ className: css(`${styles.treeView}__list`), role: isNested ? 'group' : 'tree' }, props), children)));
};
TreeViewList.displayName = 'TreeViewList';
//# sourceMappingURL=TreeViewList.js.map