import { useMemo } from "react";
import { serviceLocations } from "../../data/mockData";

export interface LocationValue {
  state: string;
  city: string;
  area: string;
}

export function LocationFields({
  value,
  onChange,
  errors = {},
  idPrefix = "registration",
}: {
  value: LocationValue;
  onChange: (location: LocationValue) => void;
  errors?: Partial<Record<keyof LocationValue, string>>;
  idPrefix?: string;
}) {
  const selectedState = serviceLocations.find((item) => item.state === value.state);
  const selectedCity = useMemo(
    () => selectedState?.cities.find((item) => item.name === value.city),
    [selectedState, value.city],
  );

  function update(key: keyof LocationValue, nextValue: string) {
    onChange({
      ...value,
      [key]: nextValue,
      ...(key === "state" ? { city: "", area: "" } : {}),
      ...(key === "city" ? { area: "" } : {}),
    });
  }

  return (
    <div className="location-fields">
      <div className="field">
        <label htmlFor={`${idPrefix}-state`}>State <span className="required-mark">*</span></label>
        <select id={`${idPrefix}-state`} value={value.state} onChange={(event) => update("state", event.target.value)} aria-invalid={errors.state ? true : undefined} aria-describedby={errors.state ? `${idPrefix}-state-error` : undefined} required>
          <option value="">Choose a state</option>
          {serviceLocations.map((item) => <option key={item.state} value={item.state}>{item.state}</option>)}
        </select>
        {errors.state && <p className="field-error" id={`${idPrefix}-state-error`} role="alert">{errors.state}</p>}
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-city`}>City <span className="required-mark">*</span></label>
        <select id={`${idPrefix}-city`} value={value.city} onChange={(event) => update("city", event.target.value)} disabled={!selectedState} aria-invalid={errors.city ? true : undefined} aria-describedby={errors.city ? `${idPrefix}-city-error` : undefined} required>
          <option value="">{selectedState ? "Choose a city" : "Choose a state first"}</option>
          {selectedState?.cities.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
        </select>
        {errors.city && <p className="field-error" id={`${idPrefix}-city-error`} role="alert">{errors.city}</p>}
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-area`}>Area / neighbourhood <span className="required-mark">*</span></label>
        <select id={`${idPrefix}-area`} value={value.area} onChange={(event) => update("area", event.target.value)} disabled={!selectedCity} aria-invalid={errors.area ? true : undefined} aria-describedby={errors.area ? `${idPrefix}-area-error` : undefined} required>
          <option value="">{selectedCity ? "Choose an area" : "Choose a city first"}</option>
          {selectedCity?.areas.map((area) => <option key={area} value={area}>{area}</option>)}
        </select>
        {errors.area && <p className="field-error" id={`${idPrefix}-area-error`} role="alert">{errors.area}</p>}
      </div>
    </div>
  );
}
