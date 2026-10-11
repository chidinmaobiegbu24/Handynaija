import { useState } from "react";

export function Avatar({
  initials,
  size = "regular",
  label,
  image,
  alt,
}: {
  initials: string;
  size?: "small" | "regular" | "large";
  label?: string;
  image?: string;
  alt?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(image) && !imageFailed;

  if (showImage) {
    return (
      <img
        className={`avatar avatar--${size} avatar--image`}
        src={image}
        alt={alt ?? label ?? `Avatar ${initials}`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span className={`avatar avatar--${size}`} role="img" aria-label={label ?? `Avatar ${initials}`}>
      {initials}
    </span>
  );
}