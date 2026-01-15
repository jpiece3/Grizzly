import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CSVUploadProps {
  onUpload: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
}

export function CSVUpload({ onUpload, isLoading, error, success }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  }, [selectedFile, onUpload]);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
  }, []);

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "relative min-h-[200px] border-2 border-dashed transition-all flex flex-col items-center justify-center p-6",
          isDragging && "border-primary bg-primary/5",
          error && "border-destructive",
          success && "border-status-online"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="csv-upload-zone"
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          data-testid="input-csv-file"
        />

        {selectedFile ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
            </div>
            <p className="text-[15px] font-medium text-foreground mb-1">
              {selectedFile.name}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            <div className="flex items-center gap-2 justify-center">
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                data-testid="button-clear-file"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button
                onClick={handleUpload}
                size="sm"
                disabled={isLoading}
                data-testid="button-upload-csv"
              >
                {isLoading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-[15px] font-medium text-foreground mb-1">
              Drop your CSV file here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse
            </p>
          </div>
        )}
      </Card>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm" data-testid="upload-error">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-status-online text-sm" data-testid="upload-success">
          <CheckCircle2 className="w-4 h-4" />
          File uploaded successfully!
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm font-medium text-foreground mb-2">CSV Format</p>
        <p className="text-xs text-muted-foreground">
          Required columns: <code className="bg-muted px-1 rounded">address</code>,{" "}
          <code className="bg-muted px-1 rounded">customer_name</code>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Optional columns: <code className="bg-muted px-1 rounded">service_type</code>,{" "}
          <code className="bg-muted px-1 rounded">notes</code>
        </p>
      </div>
    </div>
  );
}
