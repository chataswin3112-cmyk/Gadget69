interface ColorSwatchSelectorProps {
  variants: { id: number; colorName: string; hexCode: string }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const ColorSwatchSelector = ({ variants, selectedId, onSelect }: ColorSwatchSelectorProps) => {
  if (!variants.length) return null;

  return (
    <div className="flex gap-1.5">
      {variants.map((v) => (
        <button
          key={v.id}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(v.id);
          }}
          title={v.colorName}
          className="relative w-5 h-5 rounded-full border-2 transition-all duration-200"
          style={{
            backgroundColor: v.hexCode,
            borderColor: selectedId === v.id ? "hsl(var(--accent))" : "hsl(var(--border))",
            transform: selectedId === v.id ? "scale(1.2)" : "scale(1)",
          }}
        />
      ))}
    </div>
  );
};

export default ColorSwatchSelector;
