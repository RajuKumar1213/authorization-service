import { OrganizationRepository } from '../repositories/organization.repository';
import { BadRequestError, NotFoundError } from '../../../core/errors';

export class OrganizationService {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async createOrganization(ownerId: string, name: string, slug: string) {
    // In reality, check if slug is unique
    try {
      const org = await this.orgRepo.create({
        name,
        slug,
        ownerId,
      });
      return org;
    } catch (err: any) {
      if (err.code === '23505') { // unique violation in Postgres
        throw new BadRequestError('Organization slug already exists');
      }
      throw err;
    }
  }

  async getUserOrganizations(userId: string) {
    return this.orgRepo.getUserOrganizations(userId);
  }

  async verifyMembership(organizationId: string, userId: string) {
    const isMember = await this.orgRepo.isMember(organizationId, userId);
    if (!isMember) {
      throw new NotFoundError('Organization not found or you do not have access');
    }
    return true;
  }
}
