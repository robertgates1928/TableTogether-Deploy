import type { MojoContext } from '@mojojs/core';

import { MeetupParticipants } from '../models/meetupParticipants.js';
import { MeetupRecord } from '../models/meetups.js';

const PAYMENT_OPTIONS = ['Any payment mode', 'Split bill', 'Organizer pays', 'Guest pays'] as const;
const AVAILABILITY_OPTIONS = ['Any availability', 'Open spots only', 'Full only'] as const;
const PREFERENCE_OPTIONS = ['Any preference', 'No preference', 'Woman', 'Man', 'Non-binary', 'Prefer not to say'] as const;
const TIME_OPTIONS = ['Any time', 'Today', 'This week'] as const;

interface HomeFilters {
    paymentMode: string;
    availability: string;
    preference: string;
    timeWindow: string;
}

interface HomeMeetupCard extends MeetupRecord {
    joinedGuests: number;
    openSpots: number;
    isFull: boolean;
}

export default class Controller {
    async index(ctx: MojoContext): Promise<void> {
        const filters = await this.readFilters(ctx);
        const meetups = this.filteredMeetups(ctx, filters);

        ctx.stash.title = 'TableTogether';
        ctx.stash.meetups = meetups;
        ctx.stash.filters = filters;
        ctx.stash.paymentOptions = PAYMENT_OPTIONS;
        ctx.stash.availabilityOptions = AVAILABILITY_OPTIONS;
        ctx.stash.preferenceOptions = PREFERENCE_OPTIONS;
        ctx.stash.timeOptions = TIME_OPTIONS;
        ctx.stash.activeFilterCount = this.activeFilterCount(filters);
        await ctx.render();
    }

    private async readFilters(ctx: MojoContext): Promise<HomeFilters> {
        const params = await ctx.params();
        return {
            paymentMode: params.get('paymentMode')?.trim() ?? 'Any payment mode',
            availability: params.get('availability')?.trim() ?? 'Any availability',
            preference: params.get('preference')?.trim() ?? 'Any preference',
            timeWindow: params.get('timeWindow')?.trim() ?? 'Any time'
        };
    }

    private filteredMeetups(ctx: MojoContext, filters: HomeFilters): HomeMeetupCard[] {
        const participantsModel = ctx.models.meetupParticipants as MeetupParticipants;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const meetups = ctx.models.meetups.listMeetups() as MeetupRecord[];
        return meetups
            .map((meetup): HomeMeetupCard => {
                const joinedGuests = participantsModel.countParticipantsForMeetup(meetup.id);
                const openSpots = Math.max(meetup.totalSeats - 1 - joinedGuests, 0);
                return {
                    ...meetup,
                    joinedGuests,
                    openSpots,
                    isFull: openSpots === 0
                };
            })
            .filter(meetup => {
                if (filters.paymentMode !== 'Any payment mode' && meetup.paymentMode !== filters.paymentMode) {
                    return false;
                }

                if (filters.availability === 'Open spots only' && meetup.openSpots === 0) {
                    return false;
                }

                if (filters.availability === 'Full only' && meetup.openSpots > 0) {
                    return false;
                }

                if (filters.preference !== 'Any preference' && meetup.participantGenderPreference !== filters.preference) {
                    return false;
                }

                const meetupTime = new Date(meetup.meetupTime);
                if (filters.timeWindow === 'Today' && !(meetupTime >= today && meetupTime < tomorrow)) {
                    return false;
                }

                if (filters.timeWindow === 'This week' && !(meetupTime >= today && meetupTime < nextWeek)) {
                    return false;
                }

                return true;
            });
    }

    private activeFilterCount(filters: HomeFilters): number {
        const defaults = ['Any payment mode', 'Any availability', 'Any preference', 'Any time'];
        return [filters.paymentMode, filters.availability, filters.preference, filters.timeWindow]
            .filter((value, index) => value !== defaults[index])
            .length;
    }
}
