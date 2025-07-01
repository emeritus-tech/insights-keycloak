import React from 'react';
import styles from '@patternfly/react-styles/css/components/Wizard/wizard.mjs';
import { css } from '@patternfly/react-styles';
import { WizardContext } from './WizardContext';
import { debounce } from '../../helpers/util';
import { getResizeObserver } from '../../helpers/resizeObserver';
export const WizardBody = ({ children, hasNoPadding = false, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, component = 'div' }) => {
    const [hasScrollbar, setHasScrollbar] = React.useState(false);
    const [previousWidth, setPreviousWidth] = React.useState(undefined);
    const wrapperRef = React.useRef(null);
    const WrapperComponent = component;
    const { activeStep } = React.useContext(WizardContext);
    const defaultAriaLabel = ariaLabel || `${activeStep === null || activeStep === void 0 ? void 0 : activeStep.name} content`;
    React.useEffect(() => {
        const resize = () => {
            if (wrapperRef === null || wrapperRef === void 0 ? void 0 : wrapperRef.current) {
                const { offsetWidth, offsetHeight, scrollHeight } = wrapperRef.current;
                if (previousWidth !== offsetWidth) {
                    setPreviousWidth(offsetWidth);
                    setHasScrollbar(offsetHeight < scrollHeight);
                }
            }
        };
        const handleResizeWithDelay = debounce(resize, 250);
        let observer = () => { };
        if (wrapperRef === null || wrapperRef === void 0 ? void 0 : wrapperRef.current) {
            observer = getResizeObserver(wrapperRef.current, handleResizeWithDelay);
            const { offsetHeight, scrollHeight } = wrapperRef.current;
            setHasScrollbar(offsetHeight < scrollHeight);
            setPreviousWidth(wrapperRef.current.offsetWidth);
        }
        return () => {
            observer();
        };
    }, [previousWidth]);
    return (React.createElement(WrapperComponent, Object.assign({ ref: wrapperRef }, (component === 'div' && hasScrollbar && { role: 'region' }), (hasScrollbar && { 'aria-label': defaultAriaLabel, 'aria-labelledby': ariaLabelledBy, tabIndex: 0 }), { className: css(styles.wizardMain) }),
        React.createElement("div", { className: css(styles.wizardMainBody, hasNoPadding && styles.modifiers.noPadding) }, children)));
};
WizardBody.displayName = 'WizardBody';
//# sourceMappingURL=WizardBody.js.map