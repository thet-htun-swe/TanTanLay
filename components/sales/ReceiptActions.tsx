import React from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "../ui/Button";

interface ReceiptActionsProps {
  onShareImage: () => void;
  isSharing: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Sale Details actions: share the customer receipt as an image; admin can
// also edit or delete (buttons are hidden when the handler is not given)
export const ReceiptActions: React.FC<ReceiptActionsProps> = ({
  onShareImage,
  isSharing,
  onEdit,
  onDelete,
}) => {
  return (
    <View style={styles.container}>
      <Button
        title={isSharing ? "Preparing image..." : "Share receipt"}
        onPress={onShareImage}
        disabled={isSharing}
      />
      {(onEdit || onDelete) && (
        <View style={styles.row}>
          {onEdit && (
            <Button title="Edit" variant="secondary" onPress={onEdit} style={styles.half} />
          )}
          {onDelete && (
            <Button title="Delete" variant="danger" onPress={onDelete} style={styles.half} />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 32,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
  },
});
