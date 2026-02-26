import { useState } from 'react';
import {
  Sliders,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentTypesApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { AppointmentType } from '../types';

export default function PointMapping() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPoints, setEditPoints] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPoints, setNewPoints] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: appointmentTypes = [], isLoading } = useQuery({
    queryKey: ['appointment-types'],
    queryFn: () => appointmentTypesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; point_value: number }) =>
      appointmentTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
      setShowAddModal(false);
      setNewName('');
      setNewPoints('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; point_value: number; is_active: boolean }> }) =>
      appointmentTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      appointmentTypesApi.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
      setDeleteConfirmId(null);
    },
  });

  const filtered = appointmentTypes.filter(
    (at) =>
      !search ||
      at.name.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (at: AppointmentType) => {
    setEditingId(at.id);
    setEditName(at.name);
    setEditPoints(String(at.point_value));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPoints('');
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim() || !editPoints.trim()) return;
    const pointVal = parseFloat(editPoints);
    if (isNaN(pointVal) || pointVal < 0) return;
    updateMutation.mutate({
      id: editingId,
      data: { name: editName.trim(), point_value: pointVal },
    });
  };

  const handleCreate = () => {
    if (!newName.trim() || !newPoints.trim()) return;
    const pointVal = parseFloat(newPoints);
    if (isNaN(pointVal) || pointVal < 0) return;
    createMutation.mutate({ name: newName.trim(), point_value: pointVal });
  };

  const deleteTarget = appointmentTypes.find((at) => at.id === deleteConfirmId);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Visit Type Point Mapping</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Configure point values for each visit type used in uploads and reports
          </p>
        </div>
        <Button
          leftIcon={<Plus size={16} />}
          onClick={() => setShowAddModal(true)}
        >
          Add Visit Type
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search visit types by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] placeholder:text-[#94A3B8] min-h-[44px]"
          />
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner className="h-48" />
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Sliders size={40} className="mx-auto text-[#94A3B8] mb-3" />
            <p className="text-lg font-medium text-[#1E293B]">
              {search ? 'No visit types match your search' : 'No visit types configured'}
            </p>
            <p className="text-sm text-[#94A3B8] mt-1">
              {search
                ? 'Try adjusting your search term'
                : 'Add your first visit type to get started'}
            </p>
            {!search && (
              <Button
                className="mt-4"
                leftIcon={<Plus size={16} />}
                onClick={() => setShowAddModal(true)}
              >
                Add Visit Type
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F3F4F6]">
                  <th className="text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-6 py-3">
                    Visit Type Name
                  </th>
                  <th className="text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-6 py-3 w-[160px]">
                    Point Value
                  </th>
                  <th className="text-right text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-6 py-3 w-[140px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filtered.map((at) => (
                  <tr
                    key={at.id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    {editingId === at.id ? (
                      <>
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] min-h-[38px]"
                            autoFocus
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input
                            type="number"
                            value={editPoints}
                            onChange={(e) => setEditPoints(e.target.value)}
                            step="0.5"
                            min="0"
                            className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] min-h-[38px]"
                          />
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={saveEdit}
                              disabled={updateMutation.isPending}
                              className="p-2 rounded-lg hover:bg-[#ECFDF5] text-[#10B981] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center disabled:opacity-50"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 rounded-lg hover:bg-[#FEF2F2] text-[#94A3B8] hover:text-[#EF4444] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-3">
                          <span className="text-sm font-medium text-[#1E293B]">
                            {at.name}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 bg-[#EEF2FF] text-[#4F46E5] text-sm font-semibold rounded-lg">
                            {at.point_value}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => startEdit(at)}
                              className="p-2 rounded-lg hover:bg-[#EEF2FF] text-[#94A3B8] hover:text-[#4F46E5] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(at.id)}
                              className="p-2 rounded-lg hover:bg-[#FEF2F2] text-[#94A3B8] hover:text-[#EF4444] transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with count */}
          <div className="px-6 py-3 border-t border-[#F3F4F6] bg-[#F8FAFC]">
            <p className="text-[12px] text-[#94A3B8]">
              {filtered.length} visit type{filtered.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
              {!search && appointmentTypes.length > 0 && ` total`}
            </p>
          </div>
        </Card>
      )}

      {/* Error display */}
      {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
        <div className="mt-4 rounded-xl border border-[#FECDD3] bg-[#FFF1F2] p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-[#EF4444] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#EF4444]">Error</p>
              <p className="text-sm text-[#64748B] mt-0.5">
                {((createMutation.error || updateMutation.error || deleteMutation.error) as any)
                  ?.response?.data?.detail || 'An unexpected error occurred. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Visit Type Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewName('');
          setNewPoints('');
          createMutation.reset();
        }}
        title="Add Visit Type"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
              Visit Type Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. New Patient"
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] placeholder:text-[#94A3B8] min-h-[44px]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
              Point Value
            </label>
            <input
              type="number"
              value={newPoints}
              onChange={(e) => setNewPoints(e.target.value)}
              placeholder="e.g. 2.0"
              step="0.5"
              min="0"
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] placeholder:text-[#94A3B8] min-h-[44px]"
            />
          </div>

          {createMutation.isError && (
            <div className="rounded-lg border border-[#FECDD3] bg-[#FFF1F2] p-3">
              <p className="text-sm text-[#EF4444]">
                {(createMutation.error as any)?.response?.data?.detail ||
                  'Failed to create visit type. Please try again.'}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleCreate}
              isLoading={createMutation.isPending}
              disabled={!newName.trim() || !newPoints.trim()}
              className="flex-1"
            >
              Add Visit Type
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddModal(false);
                setNewName('');
                setNewPoints('');
                createMutation.reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Visit Type"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#475569]">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-[#1E293B]">
              {deleteTarget?.name}
            </span>
            ? This visit type will be deactivated and no longer appear in uploads or reports.
          </p>

          {deleteMutation.isError && (
            <div className="rounded-lg border border-[#FECDD3] bg-[#FFF1F2] p-3">
              <p className="text-sm text-[#EF4444]">
                Failed to delete visit type. Please try again.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              isLoading={deleteMutation.isPending}
              className="flex-1"
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
