import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import type { Material, InsertMaterial } from "@shared/schema";

export default function AdminMaterialsPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertMaterial) => {
      return apiRequest<Material>("POST", "/api/materials", data);
    },
    onSuccess: () => {
      setShowAddDialog(false);
      setFormData({ name: "", category: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create material",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertMaterial> }) => {
      return apiRequest<Material>("PATCH", `/api/materials/${id}`, data);
    },
    onSuccess: () => {
      setEditingMaterial(null);
      setFormData({ name: "", category: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update material",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete material",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.name) {
      toast({
        title: "Name is required",
        description: "Please enter a material name",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({
      name: formData.name,
      category: formData.category || null,
    });
  };

  const handleUpdate = () => {
    if (!editingMaterial || !formData.name) {
      toast({
        title: "Name is required",
        description: "Please enter a material name",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({
      id: editingMaterial.id,
      data: {
        name: formData.name,
        category: formData.category || null,
      },
    });
  };

  const openEditDialog = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      category: material.category || "",
    });
  };

  const closeDialogs = () => {
    setShowAddDialog(false);
    setEditingMaterial(null);
    setFormData({ name: "", category: "" });
  };

  const categories = [...new Set(materials.filter(m => m.category).map(m => m.category))];

  return (
    <AdminLayout
      title="Materials"
      subtitle={`${materials.length} materials configured`}
      actions={
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-material">
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      }
    >
      {isLoading ? (
        <LoadingSpinner className="py-16" text="Loading materials..." />
      ) : materials.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No materials yet"
          description="Add materials like mats, paper products, or other supplies that you deliver to customers."
          action={
            <Button onClick={() => setShowAddDialog(true)} data-testid="button-first-material">
              <Plus className="w-4 h-4 mr-2" />
              Add First Material
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {categories.length > 0 ? (
            <>
              {categories.map((category) => (
                <div key={category}>
                  <h2 className="text-lg font-semibold text-foreground mb-4">{category}</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {materials
                      .filter((m) => m.category === category)
                      .map((material) => (
                        <MaterialCard
                          key={material.id}
                          material={material}
                          onEdit={() => openEditDialog(material)}
                          onDelete={() => deleteMutation.mutate(material.id)}
                          isDeleting={deleteMutation.isPending}
                        />
                      ))}
                  </div>
                </div>
              ))}
              {materials.filter((m) => !m.category).length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Uncategorized</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {materials
                      .filter((m) => !m.category)
                      .map((material) => (
                        <MaterialCard
                          key={material.id}
                          material={material}
                          onEdit={() => openEditDialog(material)}
                          onDelete={() => deleteMutation.mutate(material.id)}
                          isDeleting={deleteMutation.isPending}
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onEdit={() => openEditDialog(material)}
                  onDelete={() => deleteMutation.mutate(material.id)}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Material</DialogTitle>
            <DialogDescription>
              Add a material or supply type that you deliver to customers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Logo Mat, Anti-Fatigue Mat, Paper Towels"
                data-testid="input-material-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Mats, Paper Products, Supplies"
                data-testid="input-material-category"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={closeDialogs}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex-1"
              data-testid="button-create-material"
            >
              {createMutation.isPending ? "Creating..." : "Create Material"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMaterial} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>
              Update the material details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Logo Mat"
                data-testid="input-edit-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category (optional)</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Mats"
                data-testid="input-edit-category"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={closeDialogs}
              className="flex-1"
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="flex-1"
              data-testid="button-save-material"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function MaterialCard({
  material,
  onEdit,
  onDelete,
  isDeleting,
}: {
  material: Material;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <Card className="p-5" data-testid={`material-card-${material.id}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{material.name}</p>
            {material.category && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {material.category}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            data-testid={`button-edit-${material.id}`}
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            data-testid={`button-delete-${material.id}`}
          >
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
