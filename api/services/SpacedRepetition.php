<?php
// api/services/SpacedRepetition.php
// SM-2 Spaced Repetition Algorithm (SuperMemo 2)
// quality: 0-5 (0=blackout, 3=correct with difficulty, 5=perfect)

class SpacedRepetition {
    /**
     * Calculate next review parameters based on SM-2 algorithm.
     * @param float $easeFactor Current ease factor (default 2.5)
     * @param int $intervalDays Current interval in days (default 1)
     * @param int $quality Review quality 0-5
     * @return array ['ease_factor', 'interval_days', 'next_review_date']
     */
    public static function calculate(float $easeFactor, int $intervalDays, int $quality): array {
        // Clamp quality to 0-5
        $quality = max(0, min(5, $quality));

        if ($quality >= 3) {
            // Correct response
            if ($intervalDays === 1) {
                $newInterval = 1;
            } elseif ($intervalDays === 2) {
                $newInterval = 6;
            } else {
                $newInterval = (int) round($intervalDays * $easeFactor);
            }

            // Update ease factor
            $newEaseFactor = $easeFactor + (0.1 - (5 - $quality) * (0.08 + (5 - $quality) * 0.02));
        } else {
            // Incorrect response — reset interval
            $newInterval = 1;
            $newEaseFactor = $easeFactor;
        }

        // Ease factor should never go below 1.3
        $newEaseFactor = max(1.3, $newEaseFactor);

        $nextDate = (new DateTime())->modify("+{$newInterval} days")->format('Y-m-d');

        return [
            'ease_factor'      => round($newEaseFactor, 2),
            'interval_days'    => $newInterval,
            'next_review_date' => $nextDate,
        ];
    }
}
