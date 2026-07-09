import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async createOnboarding(data: any) {
    return {
      success: true,
      message: 'Onboarding preferences saved successfully!',
      user: {
        clerk_user_id: data.clerk_user_id || 'mock_id',
        onboarding_completed: true,
      },
    };
  }

  async checkProfile(clerkUserId: string) {
    // Simulando que se o ID for "novo", ele não tem onboarding
    if (clerkUserId === 'novo') {
      return { success: true, onboarding_completed: false };
    }
    return {
      success: true,
      onboarding_completed: true,
      user: { clerk_user_id: clerkUserId, preferred_name: 'Lucas' },
    };
  }
}