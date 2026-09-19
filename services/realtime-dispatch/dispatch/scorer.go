package dispatch

import (
	"sort"
)

// ScoredCandidate represents an evaluated candidate ready for ranking
type ScoredCandidate struct {
	Candidate
	Score  float64 `json:"score"`
	Reason string  `json:"reason"`
}

// ScoreCandidates calculates multi-criteria scoring where lower score = best match
func ScoreCandidates(candidates []Candidate) []ScoredCandidate {
	scored := make([]ScoredCandidate, 0, len(candidates))

	for _, c := range candidates {
		// Distance penalty: 1 point per meter
		distancePenalty := c.DistanceToStoreMeters

		// Active load penalty: 450 points per active order
		activeOrderPenalty := float64(c.ActiveOrdersCount) * 450.0

		// Rating bonus (reduces penalty): (5.0 - rating) * 200
		ratingPenalty := (5.0 - c.Rating) * 200.0

		totalScore := distancePenalty + activeOrderPenalty + ratingPenalty

		scored = append(scored, ScoredCandidate{
			Candidate: c,
			Score:     totalScore,
			Reason:    "Proximity + Load + Rating evaluation",
		})
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].Score < scored[j].Score
	})

	return scored
}
