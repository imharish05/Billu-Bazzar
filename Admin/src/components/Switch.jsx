import React from 'react';

const Switch = ({ checked, onChange, id }) => {
  return (
    <label className="switch cursor-pointer">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onChange && onChange(e.target.checked, e)}
        id={id}
      />
      <span className="slider" />
    </label>
  );
};

export default Switch;
