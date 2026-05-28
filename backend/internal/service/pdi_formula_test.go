package service

import (
	"math"
	"testing"
)

// computePDI mirrors the formula used in PlayerService.RecalculateDevIndex (scale 0–100).
func computePDI(attendanceRatePct, avgAssessment1to10, goalAchievedPct float64) float64 {
	v := attendanceRatePct*0.20 + avgAssessment1to10*10*0.50 + goalAchievedPct*0.30
	return math.Round(v*100) / 100
}

func TestComputePDI_PerfectScores(t *testing.T) {
	// 100% attendance, 10/10 avg assessment, 100% goals achieved → 100
	got := computePDI(100, 10, 100)
	if got != 100 {
		t.Fatalf("expected 100, got %v", got)
	}
}

func TestComputePDI_ZeroScores(t *testing.T) {
	got := computePDI(0, 0, 0)
	if got != 0 {
		t.Fatalf("expected 0, got %v", got)
	}
}

func TestComputePDI_MixedExample(t *testing.T) {
	// 80% attendance, 7/10 avg, 50% goals achieved
	got := computePDI(80, 7, 50)
	// 80*0.2 + 7*10*0.5 + 50*0.3 = 16 + 35 + 15 = 66
	if got != 66 {
		t.Fatalf("expected 66, got %v", got)
	}
}
