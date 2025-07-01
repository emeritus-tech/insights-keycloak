import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/CodeEditor/code-editor.mjs';
import fileUploadStyles from '@patternfly/react-styles/css/components/FileUpload/file-upload.mjs';
import { Button, ButtonVariant, EmptyState, EmptyStateBody, EmptyStateIcon, EmptyStateActions, EmptyStateVariant, EmptyStateFooter, getResizeObserver, Popover, EmptyStateHeader } from '@patternfly/react-core';
import Editor from '@monaco-editor/react';
import CopyIcon from '@patternfly/react-icons/dist/esm/icons/copy-icon';
import UploadIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon';
import DownloadIcon from '@patternfly/react-icons/dist/esm/icons/download-icon';
import CodeIcon from '@patternfly/react-icons/dist/esm/icons/code-icon';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';
import Dropzone from 'react-dropzone';
import { CodeEditorContext } from './CodeEditorUtils';
import { CodeEditorControl } from './CodeEditorControl';
export var Language;
(function (Language) {
    Language["abap"] = "abap";
    Language["aes"] = "aes";
    Language["apex"] = "apex";
    Language["azcli"] = "azcli";
    Language["bat"] = "bat";
    Language["bicep"] = "bicep";
    Language["c"] = "c";
    Language["cameligo"] = "cameligo";
    Language["clojure"] = "clojure";
    Language["coffeescript"] = "coffeescript";
    Language["cpp"] = "cpp";
    Language["csharp"] = "csharp";
    Language["csp"] = "csp";
    Language["css"] = "css";
    Language["dart"] = "dart";
    Language["dockerfile"] = "dockerfile";
    Language["ecl"] = "ecl";
    Language["elixir"] = "elixir";
    Language["fsharp"] = "fsharp";
    Language["go"] = "go";
    Language["graphql"] = "graphql";
    Language["handlebars"] = "handlebars";
    Language["hcl"] = "hcl";
    Language["html"] = "html";
    Language["ini"] = "ini";
    Language["java"] = "java";
    Language["javascript"] = "javascript";
    Language["json"] = "json";
    Language["julia"] = "julia";
    Language["kotlin"] = "kotlin";
    Language["less"] = "less";
    Language["lexon"] = "lexon";
    Language["liquid"] = "liquid";
    Language["lua"] = "lua";
    Language["m3"] = "m3";
    Language["markdown"] = "markdown";
    Language["mips"] = "mips";
    Language["msdax"] = "msdax";
    Language["mysql"] = "mysql";
    Language["objective-c"] = "objective-c";
    Language["pascal"] = "pascal";
    Language["pascaligo"] = "pascaligo";
    Language["perl"] = "perl";
    Language["pgsql"] = "pgsql";
    Language["php"] = "php";
    Language["plaintext"] = "plaintext";
    Language["postiats"] = "postiats";
    Language["powerquery"] = "powerquery";
    Language["powershell"] = "powershell";
    Language["pug"] = "pug";
    Language["python"] = "python";
    Language["r"] = "r";
    Language["razor"] = "razor";
    Language["redis"] = "redis";
    Language["redshift"] = "redshift";
    Language["restructuredtext"] = "restructuredtext";
    Language["ruby"] = "ruby";
    Language["rust"] = "rust";
    Language["sb"] = "sb";
    Language["scala"] = "scala";
    Language["scheme"] = "scheme";
    Language["scss"] = "scss";
    Language["shell"] = "shell";
    Language["sol"] = "sol";
    Language["sql"] = "sql";
    Language["st"] = "st";
    Language["swift"] = "swift";
    Language["systemverilog"] = "systemverilog";
    Language["tcl"] = "tcl";
    Language["twig"] = "twig";
    Language["typescript"] = "typescript";
    Language["vb"] = "vb";
    Language["verilog"] = "verilog";
    Language["xml"] = "xml";
    Language["yaml"] = "yaml";
})(Language || (Language = {}));
class CodeEditor extends React.Component {
    constructor(props) {
        super(props);
        this.editor = null;
        this.wrapperRef = React.createRef();
        this.ref = React.createRef();
        this.timer = null;
        this.observer = () => { };
        this.onChange = (value, event) => {
            if (this.props.height === 'sizeToFit') {
                this.setHeightToFitContent();
            }
            if (this.props.onChange) {
                this.props.onChange(value, event);
            }
            this.setState({ value });
            this.props.onCodeChange(value);
        };
        this.handleResize = () => {
            if (this.editor) {
                this.editor.layout();
            }
        };
        this.handleGlobalKeys = (event) => {
            var _a;
            if (this.wrapperRef.current === document.activeElement && (event.key === 'ArrowDown' || event.key === ' ')) {
                (_a = this.editor) === null || _a === void 0 ? void 0 : _a.focus();
                event.preventDefault();
            }
        };
        this.editorDidMount = (editor, monaco) => {
            // eslint-disable-next-line no-bitwise
            editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Tab, () => this.wrapperRef.current.focus());
            Array.from(document.getElementsByClassName('monaco-editor')).forEach((editorElement) => editorElement.removeAttribute('role'));
            this.props.onEditorDidMount(editor, monaco);
            this.editor = editor;
            if (this.props.height === 'sizeToFit') {
                this.setHeightToFitContent();
            }
        };
        this.handleFileChange = (value, filename) => {
            this.setState({
                value,
                filename
            });
            this.props.onCodeChange(value);
        };
        this.handleFileReadStarted = () => this.setState({ isLoading: true });
        this.handleFileReadFinished = () => this.setState({ isLoading: false });
        this.onDropAccepted = (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                const fileHandle = acceptedFiles[0];
                this.handleFileChange('', fileHandle.name); // Show the filename while reading
                this.handleFileReadStarted();
                this.readFile(fileHandle)
                    .then((data) => {
                    this.handleFileReadFinished();
                    this.toggleEmptyState();
                    this.handleFileChange(data, fileHandle.name);
                })
                    .catch((error) => {
                    // eslint-disable-next-line no-console
                    console.error('error', error);
                    this.handleFileReadFinished();
                    this.handleFileChange('', ''); // Clear the filename field on a failure
                });
            }
        };
        this.onDropRejected = (rejectedFiles) => {
            if (rejectedFiles.length > 0) {
                // eslint-disable-next-line no-console
                console.error('There was an error accepting that dropped file'); // TODO
            }
        };
        this.copyCode = () => {
            navigator.clipboard.writeText(this.state.value);
            this.setState({ copied: true });
        };
        this.download = () => {
            const { value } = this.state;
            const element = document.createElement('a');
            const file = new Blob([value], { type: 'text' });
            element.href = URL.createObjectURL(file);
            element.download = `${this.props.downloadFileName}.${CodeEditor.getExtensionFromLanguage(this.props.language)}`;
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
        };
        this.toggleEmptyState = () => {
            this.setState({ showEmptyState: false });
        };
        this.state = {
            height: this.props.height,
            prevPropsCode: this.props.code,
            value: this.props.code,
            filename: '',
            isLoading: false,
            showEmptyState: true,
            copied: false
        };
    }
    static getExtensionFromLanguage(language) {
        switch (language) {
            case Language.shell:
                return 'sh';
            case Language.ruby:
                return 'rb';
            case Language.perl:
                return 'pl';
            case Language.python:
                return 'py';
            case Language.mysql:
                return 'sql';
            case Language.javascript:
                return 'js';
            case Language.typescript:
                return 'ts';
            case Language.markdown:
                return 'md';
            case Language.plaintext:
                return 'txt';
            default:
                return language.toString();
        }
    }
    setHeightToFitContent() {
        const contentHeight = this.editor.getContentHeight();
        const layoutInfo = this.editor.getLayoutInfo();
        this.editor.layout({ width: layoutInfo.width, height: contentHeight });
    }
    // this function is only called when the props change
    // the only conflict is between props.code and state.value
    static getDerivedStateFromProps(nextProps, prevState) {
        // if the code changes due to the props.code changing
        // set the value to props.code
        if (nextProps.code !== prevState.prevPropsCode) {
            return {
                value: nextProps.code,
                prevPropsCode: nextProps.code
            };
        }
        // else, don't need to change the state.value
        // because the onChange function will do all the work
        return null;
    }
    componentDidMount() {
        document.addEventListener('keydown', this.handleGlobalKeys);
        this.observer = getResizeObserver(this.ref.current, this.handleResize, true);
        this.handleResize();
    }
    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleGlobalKeys);
        this.observer();
    }
    readFile(fileHandle) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(fileHandle);
        });
    }
    render() {
        const { height, value, isLoading, showEmptyState, copied } = this.state;
        const { isDarkTheme, width, className, isCopyEnabled, copyButtonSuccessTooltipText, isReadOnly, isUploadEnabled, isLanguageLabelVisible, copyButtonAriaLabel, copyButtonToolTipText, uploadButtonAriaLabel, uploadButtonToolTipText, downloadButtonAriaLabel, downloadButtonToolTipText, toolTipDelay, toolTipCopyExitDelay, toolTipMaxWidth, toolTipPosition, isLineNumbersVisible, isDownloadEnabled, language, emptyState: providedEmptyState, emptyStateTitle, emptyStateBody, emptyStateButton, emptyStateLink, customControls, isMinimapVisible, headerMainContent, shortcutsPopoverButtonText, shortcutsPopoverProps: shortcutsPopoverPropsProp, showEditor, options: optionsProp, overrideServices, editorProps } = this.props;
        const shortcutsPopoverProps = Object.assign(Object.assign({}, CodeEditor.defaultProps.shortcutsPopoverProps), shortcutsPopoverPropsProp);
        const options = Object.assign({ scrollBeyondLastLine: height !== 'sizeToFit', readOnly: isReadOnly, cursorStyle: 'line', lineNumbers: isLineNumbersVisible ? 'on' : 'off', tabIndex: -1, minimap: {
                enabled: isMinimapVisible
            } }, optionsProp);
        return (React.createElement(Dropzone, { multiple: false, onDropAccepted: this.onDropAccepted, onDropRejected: this.onDropRejected }, ({ getRootProps, getInputProps, isDragActive, open }) => {
            const emptyState = providedEmptyState ||
                (isUploadEnabled ? (React.createElement(EmptyState, { variant: EmptyStateVariant.sm },
                    React.createElement(EmptyStateHeader, { titleText: emptyStateTitle, icon: React.createElement(EmptyStateIcon, { icon: CodeIcon }), headingLevel: "h4" }),
                    React.createElement(EmptyStateBody, null, emptyStateBody),
                    !isReadOnly && (React.createElement(EmptyStateFooter, null,
                        React.createElement(EmptyStateActions, null,
                            React.createElement(Button, { variant: "primary", onClick: open }, emptyStateButton)),
                        React.createElement(EmptyStateActions, null,
                            React.createElement(Button, { variant: "link", onClick: this.toggleEmptyState }, emptyStateLink)))))) : (React.createElement(EmptyState, { variant: EmptyStateVariant.sm },
                    React.createElement(EmptyStateHeader, { titleText: emptyStateTitle, icon: React.createElement(EmptyStateIcon, { icon: CodeIcon }), headingLevel: "h4" }),
                    !isReadOnly && (React.createElement(EmptyStateFooter, null,
                        React.createElement(EmptyStateActions, null,
                            React.createElement(Button, { variant: "primary", onClick: this.toggleEmptyState }, emptyStateLink)))))));
            const tooltipProps = {
                position: toolTipPosition,
                exitDelay: toolTipDelay,
                entryDelay: toolTipDelay,
                maxWidth: toolTipMaxWidth,
                trigger: 'mouseenter focus'
            };
            const editorHeader = (React.createElement("div", { className: css(styles.codeEditorHeader) },
                React.createElement("div", { className: css(styles.codeEditorControls) },
                    React.createElement(CodeEditorContext.Provider, { value: { code: value } },
                        isCopyEnabled && (!showEmptyState || !!value) && (React.createElement(CodeEditorControl, { icon: React.createElement(CopyIcon, null), "aria-label": copyButtonAriaLabel, tooltipProps: Object.assign(Object.assign({}, tooltipProps), { 'aria-live': 'polite', content: React.createElement("div", null, copied ? copyButtonSuccessTooltipText : copyButtonToolTipText), exitDelay: copied ? toolTipCopyExitDelay : toolTipDelay, onTooltipHidden: () => this.setState({ copied: false }) }), onClick: this.copyCode })),
                        isUploadEnabled && (React.createElement(CodeEditorControl, { icon: React.createElement(UploadIcon, null), "aria-label": uploadButtonAriaLabel, tooltipProps: Object.assign({ content: React.createElement("div", null, uploadButtonToolTipText) }, tooltipProps), onClick: open })),
                        isDownloadEnabled && (!showEmptyState || !!value) && (React.createElement(CodeEditorControl, { icon: React.createElement(DownloadIcon, null), "aria-label": downloadButtonAriaLabel, tooltipProps: Object.assign({ content: React.createElement("div", null, downloadButtonToolTipText) }, tooltipProps), onClick: this.download })),
                        customControls && customControls)),
                React.createElement("div", { className: css(styles.codeEditorHeaderMain) }, headerMainContent),
                !!shortcutsPopoverProps.bodyContent && (React.createElement("div", { className: `${styles.codeEditor}__keyboard-shortcuts` },
                    React.createElement(Popover, Object.assign({}, shortcutsPopoverProps),
                        React.createElement(Button, { variant: ButtonVariant.link, icon: React.createElement(HelpIcon, null) }, shortcutsPopoverButtonText)))),
                isLanguageLabelVisible && (React.createElement("div", { className: css(styles.codeEditorTab) },
                    React.createElement("span", { className: css(styles.codeEditorTabIcon) },
                        React.createElement(CodeIcon, null)),
                    React.createElement("span", { className: css(styles.codeEditorTabText) }, language.toUpperCase())))));
            const editor = (React.createElement("div", { className: css(styles.codeEditorCode), ref: this.wrapperRef, tabIndex: 0, dir: "ltr" },
                React.createElement(Editor, Object.assign({ height: height, width: width, language: language, value: value, options: options, overrideServices: overrideServices, onChange: this.onChange, onMount: this.editorDidMount, theme: isDarkTheme ? 'vs-dark' : 'vs-light' }, editorProps))));
            return (React.createElement("div", { className: css(styles.codeEditor, isReadOnly && styles.modifiers.readOnly, className), ref: this.ref }, isUploadEnabled || providedEmptyState ? (React.createElement("div", Object.assign({}, getRootProps({
                onClick: (event) => event.stopPropagation() // Prevents clicking TextArea from opening file dialog
            }), { className: `${fileUploadStyles.fileUpload} ${isDragActive && fileUploadStyles.modifiers.dragHover} ${isLoading && fileUploadStyles.modifiers.loading}` }),
                editorHeader,
                React.createElement("div", { className: css(styles.codeEditorMain) },
                    React.createElement("input", Object.assign({}, getInputProps())),
                    (showEmptyState || providedEmptyState) && !value ? emptyState : editor))) : (React.createElement(React.Fragment, null,
                editorHeader,
                showEditor && React.createElement("div", { className: css(styles.codeEditorMain) }, editor)))));
        }));
    }
}
CodeEditor.displayName = 'CodeEditor';
CodeEditor.defaultProps = {
    className: '',
    code: '',
    onEditorDidMount: () => { },
    language: Language.plaintext,
    isDarkTheme: false,
    height: '',
    width: '',
    isLineNumbersVisible: true,
    isReadOnly: false,
    isLanguageLabelVisible: false,
    loading: '',
    emptyState: '',
    emptyStateTitle: 'Start editing',
    emptyStateBody: 'Drag and drop a file or upload one.',
    emptyStateButton: 'Browse',
    emptyStateLink: 'Start from scratch',
    downloadFileName: Date.now().toString(),
    isUploadEnabled: false,
    isDownloadEnabled: false,
    isCopyEnabled: false,
    copyButtonAriaLabel: 'Copy code to clipboard',
    uploadButtonAriaLabel: 'Upload code',
    downloadButtonAriaLabel: 'Download code',
    copyButtonToolTipText: 'Copy to clipboard',
    uploadButtonToolTipText: 'Upload',
    downloadButtonToolTipText: 'Download',
    copyButtonSuccessTooltipText: 'Content added to clipboard',
    toolTipCopyExitDelay: 1600,
    toolTipDelay: 300,
    toolTipMaxWidth: '100px',
    toolTipPosition: 'top',
    customControls: null,
    isMinimapVisible: false,
    headerMainContent: '',
    shortcutsPopoverButtonText: 'View Shortcuts',
    shortcutsPopoverProps: Object.assign({ bodyContent: '', 'aria-label': 'Keyboard Shortcuts' }, Popover.defaultProps),
    showEditor: true,
    options: {},
    overrideServices: {},
    onCodeChange: () => { }
};
export { CodeEditor };
//# sourceMappingURL=CodeEditor.js.map