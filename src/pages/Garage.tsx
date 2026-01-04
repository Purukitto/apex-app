import { useState } from 'react';
import { Plus, Bike } from 'lucide-react';
import { useBikes } from '../hooks/useBikes';
import BikeCard from '../components/BikeCard';
import AddBikeModal from '../components/AddBikeModal';
import { Bike as BikeType } from '../types/database';

export default function Garage() {
  const { bikes, isLoading, createBike, updateBike, deleteBike } = useBikes();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<BikeType | null>(null);

  const handleAddBike = async (bikeData: Omit<BikeType, 'id' | 'user_id'>) => {
    await createBike.mutateAsync(bikeData);
  };

  const handleUpdateBike = async (
    bikeData: Omit<BikeType, 'id' | 'user_id'>
  ) => {
    if (editingBike) {
      await updateBike.mutateAsync({
        id: editingBike.id,
        updates: bikeData,
      });
      setEditingBike(null);
    }
  };

  const handleEditBike = (bike: BikeType) => {
    setEditingBike(bike);
    setIsModalOpen(true);
  };

  const handleDeleteBike = async (id: string) => {
    await deleteBike.mutateAsync(id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBike(null);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-apex-white mb-4">Garage</h1>
        <div className="text-apex-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-apex-white">Garage</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 transition-colors"
        >
          <Plus size={20} />
          Add Bike
        </button>
      </div>

      {bikes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 bg-apex-green/10 rounded-full mb-4">
            <Bike size={48} className="text-apex-green" />
          </div>
          <h2 className="text-xl font-semibold text-apex-white mb-2">
            No bikes yet
          </h2>
          <p className="text-apex-white/60 mb-6 max-w-md">
            Add your first machine to start tracking rides and maintenance.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-apex-green text-apex-black font-semibold rounded-lg hover:bg-apex-green/90 transition-colors"
          >
            <Plus size={20} />
            Add your first machine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bikes.map((bike) => (
            <BikeCard
              key={bike.id}
              bike={bike}
              onDelete={handleDeleteBike}
              onEdit={handleEditBike}
            />
          ))}
        </div>
      )}

      <AddBikeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={editingBike ? handleUpdateBike : handleAddBike}
        editingBike={editingBike}
      />
    </div>
  );
}

