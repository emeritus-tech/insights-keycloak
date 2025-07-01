"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeEditorControl = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_core_1 = require("@patternfly/react-core");
const CodeEditorUtils_1 = require("./CodeEditorUtils");
const CodeEditorControl = (_a) => {
    var { icon, className, 'aria-label': ariaLabel, onClick = () => { }, isVisible = true, tooltipProps = {} } = _a, props = tslib_1.__rest(_a, ["icon", "className", 'aria-label', "onClick", "isVisible", "tooltipProps"]);
    const context = React.useContext(CodeEditorUtils_1.CodeEditorContext);
    const onCustomClick = (event) => {
        onClick(context.code, event);
    };
    return isVisible ? (React.createElement(react_core_1.Tooltip, Object.assign({}, tooltipProps),
        React.createElement(react_core_1.Button, Object.assign({ className: className, onClick: onCustomClick, variant: "control", "aria-label": ariaLabel }, props), icon))) : null;
};
exports.CodeEditorControl = CodeEditorControl;
exports.CodeEditorControl.displayName = 'CodeEditorControl';
//# sourceMappingURL=CodeEditorControl.js.map