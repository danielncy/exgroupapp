import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { brandTokens } from "@ex-group/ui/tokens/brands";
import { submitReview, getReviewForBooking, getMyBookings } from "@ex-group/db";
import type { Review } from "@ex-group/shared/types/review";

const brand = brandTokens.ex_style;

interface BookingInfo {
  id: string;
  booking_date: string;
  start_time: string;
  status: string;
  service: { name: string } | null;
  outlet: { name: string } | null;
  stylist: { name: string } | null;
}

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [bookings, review] = await Promise.all([
        getMyBookings(),
        getReviewForBooking(bookingId!),
      ]);

      const found = (bookings as BookingInfo[]).find((b) => b.id === bookingId);
      if (found) setBooking(found);

      if (review) {
        setExistingReview(review);
        setRating(review.rating);
        setComment(review.comment ?? "");
      }
    } catch {
      Alert.alert("Error", "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      await submitReview({
        booking_id: bookingId!,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert("Thank you!", "Your review has been submitted.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to submit review"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Review",
            headerStyle: { backgroundColor: brand.primary },
            headerTintColor: "#FFFFFF",
          }}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brand.accent} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: existingReview ? "Update Review" : "Rate Your Experience",
          headerStyle: { backgroundColor: brand.primary },
          headerTintColor: "#FFFFFF",
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Booking info */}
        {booking && (
          <View style={styles.bookingCard}>
            <Text style={styles.serviceName}>
              {booking.service?.name ?? "Appointment"}
            </Text>
            <Text style={styles.outletName}>
              {booking.outlet?.name}
              {booking.stylist ? ` \u00b7 ${booking.stylist.name}` : ""}
            </Text>
            <Text style={styles.dateText}>
              {new Date(booking.booking_date).toLocaleDateString("en-SG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        )}

        {/* Star rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>How was your experience?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.star,
                    star <= rating ? styles.starFilled : styles.starEmpty,
                  ]}
                >
                  {star <= rating ? "\u2605" : "\u2606"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingHint}>
            {rating === 0 && "Tap a star to rate"}
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </Text>
        </View>

        {/* Comment */}
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Comments (optional)</Text>
          <TextInput
            style={styles.commentInput}
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            placeholder="Tell us about your experience..."
            placeholderTextColor="#9CA3AF"
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.buttonDisabled]}
          disabled={submitting}
          activeOpacity={0.8}
          onPress={() => void handleSubmit()}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {existingReview ? "Update Review" : "Submit Review"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAFA" },
  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  serviceName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  outletName: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  dateText: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  ratingSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  ratingLabel: { fontSize: 15, fontWeight: "500", color: "#374151", marginBottom: 12 },
  starsRow: { flexDirection: "row", gap: 8 },
  star: { fontSize: 40 },
  starFilled: { color: "#FBBF24" },
  starEmpty: { color: "#D1D5DB" },
  ratingHint: { fontSize: 13, color: "#6B7280", marginTop: 8 },
  commentSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  commentLabel: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 8 },
  commentInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    color: "#111827",
  },
  charCount: { fontSize: 11, color: "#9CA3AF", textAlign: "right", marginTop: 4 },
  submitButton: {
    backgroundColor: brandTokens.ex_style.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },
});
