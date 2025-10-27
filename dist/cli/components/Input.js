import TextInput from "ink-text-input";
import React, { useState } from "react";
export const Input = (props) => {
    const { handleSubmit } = props;
    const [inputValue, setInputValue] = useState("");
    return React.createElement(TextInput, { value: inputValue, onChange: setInputValue, onSubmit: (...args) => {
            handleSubmit(...args);
        } });
};
//# sourceMappingURL=Input.js.map