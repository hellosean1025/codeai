import TextInput from "ink-text-input";
import React, { useState } from "react";

export const Input = (props: {
  handleSubmit: (value: string) => void;
})=>{
  const {handleSubmit} = props;
  const [inputValue, setInputValue] = useState("");
  return <TextInput
    value={inputValue}
    onChange={setInputValue}
    onSubmit={(...args)=>{
      handleSubmit(...args)
    }}
  />
}