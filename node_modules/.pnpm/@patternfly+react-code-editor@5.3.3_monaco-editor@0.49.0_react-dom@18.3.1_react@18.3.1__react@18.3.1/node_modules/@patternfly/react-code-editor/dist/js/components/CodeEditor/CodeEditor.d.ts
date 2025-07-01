import * as React from 'react';
import { PopoverProps, TooltipPosition } from '@patternfly/react-core';
import { EditorProps, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { FileRejection } from 'react-dropzone';
export declare type ChangeHandler = (value: string, event: editor.IModelContentChangedEvent) => void;
export declare type EditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
export interface Shortcut {
    description: string;
    keys: string[];
}
export declare enum Language {
    abap = "abap",
    aes = "aes",
    apex = "apex",
    azcli = "azcli",
    bat = "bat",
    bicep = "bicep",
    c = "c",
    cameligo = "cameligo",
    clojure = "clojure",
    coffeescript = "coffeescript",
    cpp = "cpp",
    csharp = "csharp",
    csp = "csp",
    css = "css",
    dart = "dart",
    dockerfile = "dockerfile",
    ecl = "ecl",
    elixir = "elixir",
    fsharp = "fsharp",
    go = "go",
    graphql = "graphql",
    handlebars = "handlebars",
    hcl = "hcl",
    html = "html",
    ini = "ini",
    java = "java",
    javascript = "javascript",
    json = "json",
    julia = "julia",
    kotlin = "kotlin",
    less = "less",
    lexon = "lexon",
    liquid = "liquid",
    lua = "lua",
    m3 = "m3",
    markdown = "markdown",
    mips = "mips",
    msdax = "msdax",
    mysql = "mysql",
    'objective-c' = "objective-c",
    pascal = "pascal",
    pascaligo = "pascaligo",
    perl = "perl",
    pgsql = "pgsql",
    php = "php",
    plaintext = "plaintext",
    postiats = "postiats",
    powerquery = "powerquery",
    powershell = "powershell",
    pug = "pug",
    python = "python",
    r = "r",
    razor = "razor",
    redis = "redis",
    redshift = "redshift",
    restructuredtext = "restructuredtext",
    ruby = "ruby",
    rust = "rust",
    sb = "sb",
    scala = "scala",
    scheme = "scheme",
    scss = "scss",
    shell = "shell",
    sol = "sol",
    sql = "sql",
    st = "st",
    swift = "swift",
    systemverilog = "systemverilog",
    tcl = "tcl",
    twig = "twig",
    typescript = "typescript",
    vb = "vb",
    verilog = "verilog",
    xml = "xml",
    yaml = "yaml"
}
/** The main code editor component. */
export interface CodeEditorProps extends Omit<React.HTMLProps<HTMLDivElement>, 'onChange'> {
    /** Additional classes added to the code editor. */
    className?: string;
    /** Code displayed in code editor. */
    code?: string;
    /** Accessible label for the copy button. */
    copyButtonAriaLabel?: string;
    /** Text to display in the tooltip on the copy button after code is copied to clipboard. */
    copyButtonSuccessTooltipText?: string;
    /** Text to display in the tooltip on the copy button before code is copied. */
    copyButtonToolTipText?: string;
    /** A single node or array of nodes - ideally the code editor controls component - to display
     * above code editor.
     */
    customControls?: React.ReactNode | React.ReactNode[];
    /** Accessible label for the download button. */
    downloadButtonAriaLabel?: string;
    /** Text to display in the tooltip on the download button. */
    downloadButtonToolTipText?: string;
    /** Name of the file if user downloads code to local file. */
    downloadFileName?: string;
    /** Additional props to pass to the monaco editor. */
    editorProps?: EditorProps;
    /** Content to display in space of the code editor when there is no code to display. */
    emptyState?: React.ReactNode;
    /** Override default empty state body text. */
    emptyStateBody?: React.ReactNode;
    /** Override default empty state button text. */
    emptyStateButton?: React.ReactNode;
    /** Override default empty state link text. */
    emptyStateLink?: React.ReactNode;
    /** Override default empty state title text. */
    emptyStateTitle?: React.ReactNode;
    /** Editor header main content title. */
    headerMainContent?: string;
    /** Height of code editor. Defaults to 100%. 'sizeToFit' will automatically change the height
     * to the height of the content.
     */
    height?: string | 'sizeToFit';
    /** Flag to add copy button to code editor actions. */
    isCopyEnabled?: boolean;
    /** Flag indicating the editor is styled using monaco's dark theme. */
    isDarkTheme?: boolean;
    /** Flag to add download button to code editor actions. */
    isDownloadEnabled?: boolean;
    /** Flag to include a label indicating the currently configured editor language. */
    isLanguageLabelVisible?: boolean;
    /** Flag indicating the editor is displaying line numbers. */
    isLineNumbersVisible?: boolean;
    /** Flag to add the minimap to the code editor. */
    isMinimapVisible?: boolean;
    /** Flag indicating the editor is read only. */
    isReadOnly?: boolean;
    /** Flag to add upload button to code editor actions. Also makes the code editor accept a
     * file using drag and drop. */
    isUploadEnabled?: boolean;
    /** Language displayed in the editor. */
    language?: Language;
    /** The loading screen before the editor will be loaded. Defaults to 'loading...'. */
    loading?: React.ReactNode;
    /** Function which fires each time the content of the code editor is manually changed. Does
     * not fire when a file is uploaded.
     */
    onChange?: ChangeHandler;
    /** Function which fires each time the code changes in the code editor. */
    onCodeChange?: (value: string) => void;
    /** Callback which fires after the code editor is mounted containing a reference to the
     * monaco editor and the monaco instance.
     */
    onEditorDidMount?: EditorDidMount;
    /** Refer to Monaco interface {monaco.editor.IStandaloneEditorConstructionOptions}. */
    options?: editor.IStandaloneEditorConstructionOptions;
    /** Refer to Monaco interface {monaco.editor.IEditorOverrideServices}. */
    overrideServices?: editor.IEditorOverrideServices;
    /** Text to show in the button to open the shortcut popover. */
    shortcutsPopoverButtonText: string;
    /** Properties for the shortcut popover. */
    shortcutsPopoverProps?: PopoverProps;
    /** Flag to show the editor. */
    showEditor?: boolean;
    /** The delay before tooltip fades after code copied. */
    toolTipCopyExitDelay: number;
    /** The entry and exit delay for all tooltips. */
    toolTipDelay: number;
    /** The max width of the tooltips on all button. */
    toolTipMaxWidth: string;
    /** The position of tooltips on all buttons. */
    toolTipPosition?: TooltipPosition | 'auto' | 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';
    /** Accessible label for the upload button. */
    uploadButtonAriaLabel?: string;
    /** Text to display in the tooltip on the upload button. */
    uploadButtonToolTipText?: string;
    /** Width of code editor. Defaults to 100%. */
    width?: string;
}
interface CodeEditorState {
    height: string;
    prevPropsCode: string;
    value: string;
    filename: string;
    isLoading: boolean;
    showEmptyState: boolean;
    copied: boolean;
}
declare class CodeEditor extends React.Component<CodeEditorProps, CodeEditorState> {
    static displayName: string;
    private editor;
    private wrapperRef;
    private ref;
    private timer;
    private observer;
    static defaultProps: CodeEditorProps;
    static getExtensionFromLanguage(language: Language): string;
    constructor(props: CodeEditorProps);
    setHeightToFitContent(): void;
    onChange: ChangeHandler;
    static getDerivedStateFromProps(nextProps: CodeEditorProps, prevState: CodeEditorState): {
        value: string;
        prevPropsCode: string;
    };
    handleResize: () => void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    handleGlobalKeys: (event: KeyboardEvent) => void;
    editorDidMount: EditorDidMount;
    handleFileChange: (value: string, filename: string) => void;
    handleFileReadStarted: () => void;
    handleFileReadFinished: () => void;
    readFile(fileHandle: Blob): Promise<string>;
    onDropAccepted: (acceptedFiles: File[]) => void;
    onDropRejected: (rejectedFiles: FileRejection[]) => void;
    copyCode: () => void;
    download: () => void;
    toggleEmptyState: () => void;
    render(): React.JSX.Element;
}
export { CodeEditor };
//# sourceMappingURL=CodeEditor.d.ts.map