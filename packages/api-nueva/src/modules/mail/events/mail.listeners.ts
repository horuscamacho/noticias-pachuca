import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthMailService } from '../services/auth-mail.service';
import {
  UserRegisteredEvent,
  EmailConfirmationRequestedEvent,
  PasswordResetRequestedEvent,
  PasswordChangedEvent,
} from './mail.events';

@Injectable()
export class MailEventListeners {
  private readonly logger = new Logger(MailEventListeners.name);

  constructor(private readonly authMailService: AuthMailService) {}

  @OnEvent('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    this.logger.log(`Handling user registered event for: ${event.user.email}`);

    try {
      await this.authMailService.sendWelcomeEmail({
        name: event.user.name,
        email: event.user.email,
      });
      this.logger.log(
        `Welcome email sent successfully to: ${event.user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${event.user.email}: ${error.message}`,
      );
      // No throw error - email failure shouldn't break user registration
    }
  }

  @OnEvent('email.confirmation.requested')
  async handleEmailConfirmationRequested(
    event: EmailConfirmationRequestedEvent,
  ): Promise<void> {
    this.logger.log(
      `Handling email confirmation request for: ${event.user.email}`,
    );

    try {
      await this.authMailService.sendEmailConfirmation(event.user, event.token);
      this.logger.log(
        `Email confirmation sent successfully to: ${event.user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email confirmation to ${event.user.email}: ${error.message}`,
      );
    }
  }

  @OnEvent('password.reset.requested')
  async handlePasswordResetRequested(
    event: PasswordResetRequestedEvent,
  ): Promise<void> {
    this.logger.log(`Handling password reset request for: ${event.user.email}`);

    try {
      await this.authMailService.sendPasswordReset(event.user, event.token);
      this.logger.log(
        `Password reset email sent successfully to: ${event.user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset to ${event.user.email}: ${error.message}`,
      );
    }
  }

  @OnEvent('password.changed')
  async handlePasswordChanged(event: PasswordChangedEvent): Promise<void> {
    this.logger.log(`Handling password changed event for: ${event.user.email}`);

    try {
      await this.authMailService.sendPasswordChanged(event.user);
      this.logger.log(
        `Password changed notification sent successfully to: ${event.user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password changed notification to ${event.user.email}: ${error.message}`,
      );
    }
  }
}
