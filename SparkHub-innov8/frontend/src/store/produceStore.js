import { create } from 'zustand';

// Mock data to simulate fetching from an API
const mockProduceDetails = {
  id: 'tomato-123',
  title: 'Farm Fresh Tomatoes',
  description: "Delicious, sun-ripened tomatoes grown with care on our family farm.",
  category: 'Vegetables',
  listedDate: 'Sep 24, 2024',
  price: '₹120/kg',
  availableQuantity: '100 kg',
  grade: 'Grade A',
  status: 'Active',
  sellerInfo: [
    { name: 'Farmer Joe', role: 'Main Seller', avatar: 'J' },
    { name: 'Green Acres Farm', role: 'Farm Name', avatar: 'G' },
    { name: 'HarvestMark', role: 'Marketplace Verified', avatar: 'H' },
  ],
  productInfo: [
    { id: 1, title: 'Variety', description: 'Heirloom Red Tomatoes' },
    { id: 2, title: 'Harvest Date', description: 'Sep 22, 2024' },
    { id: 3, title: 'Storage Method', description: 'Cool and Dry place' },
    { id: 4, title: 'Shipping', description: 'Next-day delivery available' },
  ],
  traceability: [
    {
      id: 1,
      date: 'Sep 25, 2024',
      author: 'Farmer Joe',
      type: 'quality-check',
      content: 'Final inspection completed. All produce meets Grade A standards.'
    },
    {
      id: 2,
      date: 'Sep 20, 2024',
      author: 'Certified Organic',
      type: 'certification',
      content: 'Organic certification renewed. Our farm adheres to all standards.'
    },
    {
      id: 3,
      date: 'Sep 10, 2024',
      author: 'Farmer Joe',
      type: 'milestone',
      content: 'Planted the new batch of seeds. Expected harvest in 2-3 months.'
    },
  ],
};

const useProduceStore = create((set, get) => ({
  // State
  produceDetails: null,
  isLoading: false,
  error: null,

  // Actions
  fetchProduceDetails: async (id) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, you would fetch data based on the 'id'
      if (id === 'tomato-123') {
        set({
          produceDetails: mockProduceDetails,
          isLoading: false,
        });
      } else {
        throw new Error('Produce item not found');
      }

    } catch (error) {
      set({
        error: error.message || 'Failed to fetch produce details',
        isLoading: false,
      });
    }
  },

  addTraceabilityUpdate: async (update) => {
    try {
      const newUpdate = {
        id: Date.now(),
        ...update,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      set(state => ({
        produceDetails: {
          ...state.produceDetails,
          traceability: [newUpdate, ...(state.produceDetails?.traceability || [])],
        },
      }));

      return { success: true, update: newUpdate };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useProduceStore;
