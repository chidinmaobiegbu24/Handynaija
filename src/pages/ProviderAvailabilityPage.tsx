import { providers } from "../data/mockData";

const availability = [
  { day: "Monday", slots: ["8:00 AM - 11:00 AM", "1:00 PM - 5:00 PM"] },
  { day: "Tuesday", slots: ["9:00 AM - 12:00 PM", "2:00 PM - 6:00 PM"] },
  { day: "Wednesday", slots: ["10:00 AM - 1:00 PM"] },
  { day: "Thursday", slots: ["8:00 AM - 12:00 PM", "3:00 PM - 6:00 PM"] },
  { day: "Friday", slots: ["9:00 AM - 1:00 PM", "2:00 PM - 5:00 PM"] },
];

export function ProviderAvailabilityPage() {
  const provider = providers[0];

  return (
    <section className="page-section">
      <div className="container">
        <p className="eyebrow">schedule</p>
        <h1 className="page-title">Manage your availability</h1>
        <p className="page-lede">Set your working hours and service windows so customers can book you with confidence.</p>

        <div className="availability-grid">
          {availability.map((day) => (
            <article className="availability-card" key={day.day}>
              <h3>{day.day}</h3>
              <div className="availability-list">
                {day.slots.map((slot) => (
                  <span key={slot} className="availability-pill">{slot}</span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="empty-card">
          <p>{provider.businessName} is currently available across Lagos mainland and nearby neighborhoods.</p>
          <button className="button button--primary" type="button">Update schedule</button>
        </div>
      </div>
    </section>
  );
}
