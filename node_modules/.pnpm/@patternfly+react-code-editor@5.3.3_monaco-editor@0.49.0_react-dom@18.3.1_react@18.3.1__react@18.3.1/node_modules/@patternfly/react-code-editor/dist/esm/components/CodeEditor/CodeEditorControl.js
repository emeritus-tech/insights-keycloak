import { __rest } from "tslib";
import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { CodeEditorContext } from './CodeEditorUtils';
export const CodeEditorControl = (_a) => {
    var { icon, className, 'aria-label': ariaLabel, onClick = () => { }, isVisible = true, tooltipProps = {} } = _a, props = __rest(_a, ["icon", "className", 'aria-label', "onClick", "isVisible", "tooltipProps"]);
    const context = React.useContext(CodeEditorContext);
    const onCustomClick = (event) => {
        onClick(context.code, event);
    };
    return isVisible ? (React.createElement(Tooltip, Object.assign({}, tooltipProps),
        React.createElement(Button, Object.assign({ className: className, onClick: onCustomClick, variant: "control", "aria-label": ariaLabel }, props), icon))) : null;
};
CodeEditorControl.displayName = 'CodeEditorControl';
//# sourceMappingURL=CodeEditorControl.js.map