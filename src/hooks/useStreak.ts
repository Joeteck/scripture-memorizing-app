import { useMemo } from "react";
import { Verse } from "@/types";

export type StreakData = {
    currentStreak: number;
    bestStreak: number;
    completedToday: boolean;
};

function toDateString(date: Date) {
    return date.toISOString().split("T")[0];
}

function daysBetween(a: Date, b: Date) {
    const diff =
        Math.abs(a.getTime() - b.getTime()) /
        (1000 * 60 * 60 * 24);

    return Math.floor(diff);
}

export function useStreak(
    verses: Verse[]
    ): StreakData {
    return useMemo(() => {
        const mastered = verses
        .filter((v) => v.date_mastered)
        .sort((a, b) =>
            (a.date_mastered ?? "").localeCompare(
            b.date_mastered ?? ""
            )
        );

        if (mastered.length === 0) {
        return {
            currentStreak: 0,
            bestStreak: 0,
            completedToday: false,
        };
        }

        const uniqueDates = Array.from(
        new Set(
            mastered.map((v) => v.date_mastered!)
        )
        );

        const today = new Date();
        const todayString = toDateString(today);

        const completedToday =
        uniqueDates.includes(todayString);

        //-----------------------------------
        // Current streak
        //-----------------------------------

        let current = 0;

        let pointer = new Date(today);

        while (true) {
        const key = toDateString(pointer);

        if (uniqueDates.includes(key)) {
            current++;
        } else {
            break;
        }

        pointer.setDate(pointer.getDate() - 1);
        }

        //-----------------------------------
        // Best streak
        //-----------------------------------

        let best = 1;
        let running = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
        const previous = new Date(uniqueDates[i - 1]);
        const currentDate = new Date(uniqueDates[i]);

        if (
            daysBetween(previous, currentDate) === 1
        ) {
            running++;
            best = Math.max(best, running);
        } else {
            running = 1;
        }
        }

        return {
        currentStreak: current,
        bestStreak: best,
        completedToday,
        };
    }, [verses]);
}