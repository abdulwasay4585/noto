<?php
// api/services/RoadmapGenerator.php

class RoadmapGenerator {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Generate study plan tasks for a given plan.
     * Logic:
     * 1. Calculate total available days between today and exam_date
     * 2. Distribute subjects proportionally across sessions
     * 3. For each subject, pull related resources and topics from topic_tags
     * 4. Schedule tasks with ~hours_per_week constraint
     */
    public function generate(array $plan): array {
        $examDate = new DateTime($plan['exam_date']);
        $today = new DateTime();
        $totalDays = (int) $today->diff($examDate)->days;

        if ($totalDays <= 0) {
            throw new Exception("Exam date must be in the future.");
        }

        $subjectIds = $plan['subjects']; // array of integers
        $hoursPerWeek = $plan['hours_per_week'];
        $totalSessions = (int) floor(($totalDays / 7) * ($hoursPerWeek / 1.5)); // ~90 min sessions
        $sessionsPerSubject = max(1, (int) floor($totalSessions / count($subjectIds)));

        $tasks = [];
        $taskDate = clone $today;
        $taskDate->modify('+1 day');

        foreach ($subjectIds as $subjectId) {
            // Get subject name
            $stmt = $this->pdo->prepare("SELECT name FROM subjects WHERE id = ?");
            $stmt->execute([$subjectId]);
            $subject = $stmt->fetch();
            $subjectName = $subject ? $subject['name'] : 'Unknown';

            // Get resources for this subject with their topic_tags
            $stmt = $this->pdo->prepare("
                SELECT id, title, topic_tags, difficulty_level 
                FROM resources 
                WHERE subject_id = ? 
                ORDER BY RANDOM() 
                LIMIT ?
            ");
            $stmt->execute([$subjectId, $sessionsPerSubject]);
            $resources = $stmt->fetchAll();

            $topicsUsed = [];

            for ($i = 0; $i < $sessionsPerSubject; $i++) {
                // Skip weekends for better UX
                while (in_array($taskDate->format('N'), ['6', '7'])) {
                    $taskDate->modify('+1 day');
                }

                if ($taskDate >= $examDate) break;

                $resource = $resources[$i] ?? null;
                $resourceIds = $resource ? [$resource['id']] : [];

                // Pick a topic from the resource's tags or use subject name
                $topic = $subjectName . ' — Session ' . ($i + 1);
                if ($resource && !empty($resource['topic_tags'])) {
                    // Parse postgres array string {tag1,tag2}
                    $tags = $this->parsePostgresArray($resource['topic_tags']);
                    if (!empty($tags)) {
                        $topic = $tags[array_rand($tags)];
                        $topicsUsed[] = $topic;
                    }
                }

                $isWeak = false; // Will be updated once quiz results exist

                $tasks[] = [
                    'plan_id'           => $plan['id'],
                    'scheduled_date'    => $taskDate->format('Y-m-d'),
                    'subject_id'        => $subjectId,
                    'topic'             => $topic,
                    'resource_ids'      => '{' . implode(',', $resourceIds) . '}',
                    'estimated_minutes' => 90,
                    'status'            => 'pending',
                    'is_weak_topic'     => $isWeak,
                ];

                $taskDate->modify('+1 day');
            }

            // Add a review session 1 week after the last session
            $taskDate->modify('+7 days');
            while (in_array($taskDate->format('N'), ['6', '7'])) {
                $taskDate->modify('+1 day');
            }
            if ($taskDate < $examDate && !empty($topicsUsed)) {
                $tasks[] = [
                    'plan_id'           => $plan['id'],
                    'scheduled_date'    => $taskDate->format('Y-m-d'),
                    'subject_id'        => $subjectId,
                    'topic'             => $subjectName . ' — Spaced Review',
                    'resource_ids'      => '{}',
                    'estimated_minutes' => 60,
                    'status'            => 'pending',
                    'is_weak_topic'     => false,
                ];
                $taskDate->modify('+1 day');
            }
        }

        return $tasks;
    }

    private function parsePostgresArray(string $pgArray): array {
        // Converts {tag1,"tag with space",tag3} to PHP array
        $inner = trim($pgArray, '{}');
        if (empty($inner)) return [];
        preg_match_all('/"([^"]+)"|([^,]+)/', $inner, $matches);
        $result = [];
        foreach ($matches[0] as $item) {
            $result[] = trim($item, '"');
        }
        return $result;
    }
}
