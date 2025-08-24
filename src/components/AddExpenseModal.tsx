import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from 'lucide-react';
import { toast } from "sonner";
import { dataService } from '@/lib/data';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
}

const AddExpenseModal = ({ isOpen, onClose, onExpenseAdded }: AddExpenseModalProps) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    submittedBy: 'dina_dev'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Equipment',
    'Training',
    'Meals',
    'Software',
    'Travel',
    'Office Supplies',
    'Tools',
    'Other'
  ];

  const submitters = [
    { id: 'dina_dev', name: 'Dina Dev', role: 'Software Engineer' },
    { id: 'raj_manager', name: 'Raj Manager', role: 'Engineering Manager' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const newExpense = await dataService.addNewExpense({
        description: formData.description,
        amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        submittedBy: formData.submittedBy,
        department: 'Engineering', // Both Dina and Raj are in Engineering
        category: formData.category
      });

      toast.success(`Expense ${newExpense.id} added successfully!`);
      
      // Reset form
      setFormData({
        description: '',
        amount: '',
        category: '',
        submittedBy: 'dina_dev'
      });
      
      onClose();
      onExpenseAdded();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      description: '',
      amount: '',
      category: '',
      submittedBy: 'dina_dev'
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Expense
          </DialogTitle>
          <DialogDescription>
            Create a new expense report for the system
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter expense description"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="submittedBy">Submitted By *</Label>
              <Select
                value={formData.submittedBy}
                onValueChange={(value) => setFormData({ ...formData, submittedBy: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select submitter" />
                </SelectTrigger>
                <SelectContent>
                  {submitters.map((submitter) => (
                    <SelectItem key={submitter.id} value={submitter.id}>
                      <div className="flex items-center gap-2">
                        <span>{submitter.name}</span>
                        <span className="text-xs text-gray-500">({submitter.role})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal; 