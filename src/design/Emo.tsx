// Gulltekst (background-clip: text) maler også emojier gull. Emo pakker emojiene inn så de beholder fargene sine.
const EMOJI = /(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*|[0-9#*]️?⃣)/u;

export function Emo({ text }: { text: string }) {
  const parts = text.split(new RegExp(EMOJI.source, 'gu'));
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} className="emo">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}
