import type { MojoContext } from '@mojojs/core';

import { Meetups, NewMeetup } from '../models/meetups.js';
import { MeetupParticipants } from '../models/meetupParticipants.js';
import { Users } from '../models/users.js';

const GENDER_OPTIONS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'] as const;
const PREFERENCE_OPTIONS = ['No preference', ...GENDER_OPTIONS] as const;
const PAYMENT_OPTIONS = ['Split bill', 'Organizer pays', 'Guest pays'] as const;

interface MeetupFormValues {
    restaurantName: string;
    meetupTime: string;
    photoUrl: string;
    organizerGender: string;
    participantGenderPreference: string;
    totalSeats: string;
    paymentMode: string;
    notes: string;
    safetyAcknowledged: boolean;
}

interface DetailContext {
    meetup: NonNullable<ReturnType<Meetups['meetupWithId']>>;
    organizerName: string;
    participants: ReturnType<MeetupParticipants['listParticipantsForMeetup']>;
    participantCount: number;
    spotsLeft: number;
    isOwner: boolean;
    isParticipant: boolean;
    canJoin: boolean;
}

export default class Controller {
    async newPage(ctx: MojoContext): Promise<void> {
        this.stashForm(ctx, this.defaultValues(), []);
        await ctx.render();
    }

    async detailPage(ctx: MojoContext): Promise<void> {
        const meetupId = Number(ctx.stash.id);
        const detail = await this.getDetailContext(ctx, meetupId);
        if (!detail) {
            await ctx.render({ status: 404, text: 'Meetup not found.' });
            return;
        }

        this.stashDetail(ctx, detail);
        await ctx.render({ view: 'meetups/detailPage' });
    }

    async joinAction(ctx: MojoContext): Promise<void> {
        const meetupId = Number(ctx.stash.id);
        const detail = await this.getDetailContext(ctx, meetupId);
        if (!detail) {
            await ctx.render({ status: 404, text: 'Meetup not found.' });
            return;
        }

        if (detail.isOwner) {
            this.stashDetail(ctx, detail, 'You already hold the organizer spot for this meetup.');
            await ctx.render({ view: 'meetups/detailPage', status: 400 });
            return;
        }

        if (detail.isParticipant) {
            this.stashDetail(ctx, detail, 'You have already joined this meetup.');
            await ctx.render({ view: 'meetups/detailPage', status: 400 });
            return;
        }

        if (detail.spotsLeft <= 0) {
            this.stashDetail(ctx, detail, 'This meetup is already full.');
            await ctx.render({ view: 'meetups/detailPage', status: 400 });
            return;
        }

        const session = await ctx.session();
        const participantsModel = ctx.models.meetupParticipants as MeetupParticipants;
        participantsModel.joinMeetup(meetupId, session.userId);
        await ctx.redirectTo(`/meetups/${meetupId}`);
    }

    async leaveAction(ctx: MojoContext): Promise<void> {
        const meetupId = Number(ctx.stash.id);
        const detail = await this.getDetailContext(ctx, meetupId);
        if (!detail) {
            await ctx.render({ status: 404, text: 'Meetup not found.' });
            return;
        }

        if (detail.isOwner) {
            this.stashDetail(ctx, detail, 'Organizers cannot leave their own meetup from this screen.');
            await ctx.render({ view: 'meetups/detailPage', status: 400 });
            return;
        }

        if (!detail.isParticipant) {
            this.stashDetail(ctx, detail, 'You are not part of this meetup yet.');
            await ctx.render({ view: 'meetups/detailPage', status: 400 });
            return;
        }

        const session = await ctx.session();
        const participantsModel = ctx.models.meetupParticipants as MeetupParticipants;
        participantsModel.leaveMeetup(meetupId, session.userId);
        await ctx.redirectTo(`/meetups/${meetupId}`);
    }

    async create(ctx: MojoContext): Promise<void> {
        const params = await ctx.params();
        const values = this.readValues(params);
        const errors = this.validate(values);

        if (errors.length > 0) {
            this.stashForm(ctx, values, errors);
            await ctx.render({ view: 'meetups/newPage', status: 400 });
            return;
        }

        const session = await ctx.session();
        const meetupsModel = ctx.models.meetups as Meetups;
        const meetup: NewMeetup = {
            organizerUserId: session.userId,
            restaurantName: values.restaurantName,
            meetupTime: values.meetupTime,
            photoUrl: values.photoUrl,
            organizerGender: values.organizerGender,
            participantGenderPreference: values.participantGenderPreference,
            totalSeats: Number(values.totalSeats),
            paymentMode: values.paymentMode,
            notes: values.notes,
            safetyAcknowledged: values.safetyAcknowledged
        };

        const createdMeetup = meetupsModel.newMeetup(meetup);
        await ctx.redirectTo(`/meetups/${createdMeetup.id}`);
    }

    private stashForm(ctx: MojoContext, values: MeetupFormValues, errors: string[]): void {
        ctx.stash.title = 'Create Meetup';
        ctx.stash.values = values;
        ctx.stash.errors = errors;
        ctx.stash.genderOptions = GENDER_OPTIONS;
        ctx.stash.preferenceOptions = PREFERENCE_OPTIONS;
        ctx.stash.paymentOptions = PAYMENT_OPTIONS;
    }

    private defaultValues(): MeetupFormValues {
        return {
            restaurantName: '',
            meetupTime: '',
            photoUrl: '',
            organizerGender: 'Prefer not to say',
            participantGenderPreference: 'No preference',
            totalSeats: '2',
            paymentMode: 'Split bill',
            notes: '',
            safetyAcknowledged: false
        };
    }

    private readValues(params: Awaited<ReturnType<MojoContext['params']>>): MeetupFormValues {
        return {
            restaurantName: params.get('restaurantName')?.trim() ?? '',
            meetupTime: params.get('meetupTime')?.trim() ?? '',
            photoUrl: params.get('photoUrl')?.trim() ?? '',
            organizerGender: params.get('organizerGender')?.trim() ?? '',
            participantGenderPreference: params.get('participantGenderPreference')?.trim() ?? '',
            totalSeats: params.get('totalSeats')?.trim() ?? '',
            paymentMode: params.get('paymentMode')?.trim() ?? '',
            notes: params.get('notes')?.trim() ?? '',
            safetyAcknowledged: params.get('safetyAcknowledged') === 'on'
        };
    }

    private validate(values: MeetupFormValues): string[] {
        const errors: string[] = [];
        const totalSeats = Number(values.totalSeats);

        if (values.restaurantName.length === 0) {
            errors.push('Restaurant name is required.');
        }

        if (values.meetupTime.length === 0) {
            errors.push('Meetup time is required.');
        }

        if (values.photoUrl.length === 0) {
            errors.push('Photo URL is required.');
        } else {
            const isValidUrl = this.isValidHttpsUrl(values.photoUrl);
            if (!isValidUrl) {
                errors.push('Photo URL must be a valid https URL.');
            }
        }

        if (!GENDER_OPTIONS.includes(values.organizerGender as typeof GENDER_OPTIONS[number])) {
            errors.push('Organizer gender must use a listed option.');
        }

        if (!PREFERENCE_OPTIONS.includes(values.participantGenderPreference as typeof PREFERENCE_OPTIONS[number])) {
            errors.push('Participant preference must use a listed option.');
        }

        if (!Number.isInteger(totalSeats) || totalSeats < 2 || totalSeats > 12) {
            errors.push('Total seats must be a whole number between 2 and 12.');
        }

        if (!PAYMENT_OPTIONS.includes(values.paymentMode as typeof PAYMENT_OPTIONS[number])) {
            errors.push('Payment mode must use a listed option.');
        }

        if (!values.safetyAcknowledged) {
            errors.push('You must agree to the safety guidelines before creating a meetup.');
        }

        return errors;
    }

    private isValidHttpsUrl(value: string): boolean {
        try {
            const url = new URL(value);
            return url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    private async getDetailContext(ctx: MojoContext, meetupId: number): Promise<DetailContext | null> {
        const meetupsModel = ctx.models.meetups as Meetups;
        const participantsModel = ctx.models.meetupParticipants as MeetupParticipants;
        const usersModel = ctx.models.users as Users;
        const meetup = meetupsModel.meetupWithId(meetupId);

        if (!meetup) {
            return null;
        }

        const session = await ctx.session();
        const participants = participantsModel.listParticipantsForMeetup(meetupId);
        const participantCount = participants.length;
        const reservedOrganizerSeat = 1;
        const spotsLeft = Math.max(meetup.totalSeats - reservedOrganizerSeat - participantCount, 0);
        const organizer = usersModel.userWithId(Number(meetup.organizerUserId));
        const isOwner = meetup.organizerUserId === session.userId;
        const isParticipant = participantsModel.isParticipant(meetupId, session.userId);

        return {
            meetup,
            organizerName: organizer?.profileName ?? 'Unknown organizer',
            participants,
            participantCount,
            spotsLeft,
            isOwner,
            isParticipant,
            canJoin: !isOwner && !isParticipant && spotsLeft > 0
        };
    }

    private stashDetail(ctx: MojoContext, detail: DetailContext, errorMessage?: string): void {
        ctx.stash.title = detail.meetup.restaurantName;
        ctx.stash.meetup = detail.meetup;
        ctx.stash.organizerName = detail.organizerName;
        ctx.stash.participants = detail.participants;
        ctx.stash.participantCount = detail.participantCount;
        ctx.stash.spotsLeft = detail.spotsLeft;
        ctx.stash.isOwner = detail.isOwner;
        ctx.stash.isParticipant = detail.isParticipant;
        ctx.stash.canJoin = detail.canJoin;
        ctx.stash.errorMessage = errorMessage;
    }
}
