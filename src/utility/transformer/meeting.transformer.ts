export function getAllMeetingResponse(meetingList: any) {

    let meetings = [];

    for (const meeting of meetingList) {
        const names = meeting.invitees.map(inv => inv.user?.username?.trim()).join(", ");
        meetings.push({
            id: meeting.id,
            sender_id: meeting.sender_id,
            url: meeting.url,
            date_time: meeting.date_time,
            duration: meeting.duration,
            status: meeting.status,
            event_type: meeting.event_type,
            project_id: meeting.project_id,
            created_at: meeting.created_at,
            sender_name: meeting.sender?.username,
            invitees_names: names,
            project_name: meeting.project?.name,
        });
    }

    return meetings;

}