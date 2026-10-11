import type { UserRole } from "../../types";

const choices: { role: "CUSTOMER" | "PROVIDER"; title: string; description: string; icon: string }[] = [
  { role: "CUSTOMER", title: "Customer", description: "Find and hire local service professionals.", icon: "⌕" },
  { role: "PROVIDER", title: "Service provider", description: "Offer your services and connect with customers.", icon: "✳" },
];

export function RoleChoice({
  value,
  onChange,
}: {
  value: UserRole | null;
  onChange: (role: "CUSTOMER" | "PROVIDER") => void;
}) {
  return (
    <fieldset className="role-choice">
      <legend className="field__legend">What are you looking for? <span className="required-mark">*</span></legend>
      <div className="role-choice__grid">
        {choices.map((choice) => (
          <label className={`role-card${value === choice.role ? " role-card--selected" : ""}`} key={choice.role}>
            <input
              type="radio"
              name="account-role"
              value={choice.role}
              checked={value === choice.role}
              required
              onChange={() => onChange(choice.role)}
            />
            <span className="role-card__icon" aria-hidden="true">{choice.icon}</span>
            <span className="role-card__text"><strong>{choice.title}</strong><span>{choice.description}</span></span>
            <span className="role-card__check" aria-hidden="true">{value === choice.role ? "✓" : ""}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
