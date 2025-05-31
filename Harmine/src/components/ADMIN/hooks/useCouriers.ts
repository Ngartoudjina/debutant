import { useState } from 'react';
import { Courier, COURIER_STATUS } from '../types';
import { toast } from 'react-toastify';

export const useCouriers = (initialCouriers: Courier[] = []) => {
  const [couriers, setCouriers] = useState<Courier[]>(initialCouriers);

  const addCourier = (courier: Courier) => {
    setCouriers((prev) => [...prev, courier]);
    toast.success('Coursier ajouté avec succès');
  };

  const updateCourier = (id: string, updatedData: Partial<Courier>) => {
    setCouriers((prev) =>
      prev.map((courier) =>
        courier.id === id ? { ...courier, ...updatedData } : courier
      )
    );
    toast.success('Coursier mis à jour avec succès');
  };

  const deactivateCourier = (id: string) => {
    setCouriers((prev) =>
      prev.map((courier) =>
        courier.id === id ? { ...courier, status: COURIER_STATUS.INACTIVE } : courier
      )
    );
    toast.success('Coursier désactivé avec succès');
  };

  return { couriers, setCouriers, addCourier, updateCourier, deactivateCourier };
};