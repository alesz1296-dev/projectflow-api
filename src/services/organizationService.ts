import { prisma } from '../lib/prisma';

export class OrganizationService {
  /**
   * ============================================
   * CREATE ORGANIZATION
   * ============================================
   */
  static async createOrganization(
    userId: number,
    data: {
      name: string;
      description?: string;
      slug: string;
      // Optional update fields
      additionalData?: { name?: string; description?: string; slug?: string };
    }
  ) {
    // Validate input
    if (!userId || !data.name || !data.slug) {
      throw new Error('User ID, name, and slug are required.');
    }

    // Check if slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: data.slug },
    });
    if (existingOrg) {
      throw new Error('Organization slug already exists.');
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        description: data.description,
        slug: data.slug,
        ownerId: userId,
      },
    });

    // Apply additional updates if provided
    let finalOrganization = organization;
    if (data.additionalData) {
      finalOrganization = await prisma.organization.update({
        where: { id: organization.id },
        data: data.additionalData,
      });
    }

    // Create membership (add user as OWNER)
    await prisma.membership.create({
      data: {
        userId,
        organizationId: organization.id,
        role: 'OWNER',
      },
    });

    return finalOrganization;
  }

  /**
   * ============================================
   * GET ORGANIZATIONS BY USER
   * ============================================
   */
  static async getOrganizationsByUser(userId: number) {
    // Check if user ID exists first
    if (!userId) {
      throw new Error('User ID is required.');
    }

    // Get all Organizations where user is a member
    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: { organization: true },
    });

    // Transform each item into array
    return memberships.map((m: any) => m.organization);
  }

  /**
   * ============================================
   * GET ORGANIZATION BY ID
   * ============================================
   */
  static async getOrganization(id: number) {
    // Get single organization by ID
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        owner: true, // Include owner user details
        memberships: true, // Include all members
      },
    });

    if (!organization) {
      throw new Error('Organization not found.');
    }

    return organization;
  }

  /**
   * ============================================
   * UPDATE ORGANIZATION
   * ============================================
   */
  static async updateOrganization(
    id: number,
    userId: number,
    data: { name?: string; description?: string; slug?: string }
  ) {
    // Step 1: Get organization
    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new Error('Organization not found.');
    }

    // Step 2: Check authorization (only OWNER can update)
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: id },
      },
    });

    if (membership?.role !== 'OWNER') {
      throw new Error('Unauthorized. Only OWNER can update organization.');
    }

    // Step 3: Check slug uniqueness (if slug is being updated)
    if (data.slug && data.slug !== organization.slug) {
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: data.slug },
      });
      if (existingOrg) {
        throw new Error('Slug already exists.');
      }
    }

    // Step 4: Update organization
    const updated = await prisma.organization.update({
      where: { id },
      data: {
        name: data.name || organization.name,
        description:
          data.description !== undefined
            ? data.description
            : organization.description,
        slug: data.slug || organization.slug,
      },
    });

    return updated;
  }

  /**
   * ============================================
   * DELETE ORGANIZATION
   * ============================================
   */
  static async deleteOrganization(id: number, userId: number) {
    // Step 1: Get organization
    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new Error('Organization not found.');
    }

    // Step 2: Check authorization (only OWNER can delete)
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: id },
      },
    });

    if (membership?.role !== 'OWNER') {
      throw new Error('Unauthorized. Only OWNER can delete organization.');
    }

    // Step 3: Delete organization (cascades delete projects & tasks)
    await prisma.organization.delete({
      where: { id },
    });

    return { message: 'Organization deleted successfully.' };
  }
}
