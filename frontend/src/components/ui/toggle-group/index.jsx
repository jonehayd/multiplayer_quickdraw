import "./toggle-group.css";

export default function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="toggle-group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`toggle-group-btn ${
            value === option.value ? "active" : ""
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
