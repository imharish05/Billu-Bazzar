import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

const SortableRow = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative',
    background: isDragging ? '#fdf8f0' : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-brand-light/10 transition-colors">
      <td className="pl-3 pr-1 py-4 w-8">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-brand-grey/40 hover:text-brand-gold transition-colors touch-none"
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
      </td>
      {children}
    </tr>
  );
};

export default SortableRow;
