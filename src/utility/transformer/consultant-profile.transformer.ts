import { UserRole, UserStatus } from "constant/enums";

export function consultantRegistertObjectTransformer(user: any) {
    let transformed: any = {};
    transformed = {
        consultant: {
            core_module: [],
            other_module: [],
            experience: user.total_experience_years,
            rate: null,
            weekly_available_hours: null,
            cv_url: "",
            clients_summary: user.clients_summary ?? user.profile_summary,
            skills: user.skills,
            work_experiences: user.work_experiences,
            projects: user.projects,
            education: user.education,
            certifications: user.certifications,
            languages: user.languages
        },
        user: {
            username: user.username,
            role: UserRole.CONSULTANT,
            email: user.email,
            phone: user.phone,
            password: '',
            confirmPassword: '',
            currency: "PKR",
            city: user.city,
            country: user.country,
            status: UserStatus.ACTIVE
        }
    }

    return transformed;
    
}
