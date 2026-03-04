import { prisma } from '../lib/prisma';

export class ProjectService {
  /**
   * ============================================
   * CREATE PROJECT
   * ============================================
   */
  static async createProject(
    organizationId: number,
    userId: number,
    data: { name: string; description?: string }
  ) {
    // Validate organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found.');
    }

    // Check if user is member of organization
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });

    if (!membership) {
      throw new Error(
        'Unauthorized. User is not a member of this organization.'
      );
    }

    // Create project and add creator as ADMIN in transaction
    const project = await prisma.$transaction(async (tx: any) => {
      // Create project
      const newProject = await tx.project.create({
        data: {
          name: data.name,
          description: data.description,
          organizationId,
          createdBy: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          organization: true,
        },
      });

      // Automatically add creator as ADMIN
      await tx.projectMembership.create({
        data: {
          userId,
          projectId: newProject.id,
          role: 'ADMIN',
        },
      });

      return newProject;
    });

    return project;
  }
  /**
   * ============================================
   * GET PROJECTS BY ORGANIZATION
   * ============================================
   */
  static async getProjects(organizationId: number) {
    // Validate organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found.');
    }

    // Get all projects in organization
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  /**
   * ============================================
   * GET PROJECT BY ID
   * ============================================
   */
  static async getProject(id: number) {
    // Get project by ID with full details
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        organization: true,
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found.');
    }

    return project;
  }

  /**
   * ============================================
   * GET PROJECTS BY STATUS
   * ============================================
   */
  static async getProjectsByStatus(status: 'ACTIVE' | 'ARCHIVED') {
    // Get all projects with specified status
    const projects = await prisma.project.findMany({
      where: { status },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        organization: true,
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  /**
   * ============================================
   * UPDATE PROJECT
   * ============================================
   */
  static async updateProject(
    id: number,
    userId: number,
    data: {
      name?: string;
      description?: string;
      status?: 'ACTIVE' | 'ARCHIVED';
    }
  ) {
    // Get project
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new Error('Project not found.');
    }

    // Check if user is member of organization
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: project.organizationId,
        },
      },
    });

    if (!membership) {
      throw new Error(
        'Unauthorized. User is not a member of this organization.'
      );
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: data.name || project.name,
        description:
          data.description !== undefined
            ? data.description
            : project.description,
        status: data.status || project.status,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        organization: true,
      },
    });

    return updatedProject;
  }

  /**
   * ============================================
   * DELETE PROJECT
   * ============================================
   */
  static async deleteProject(id: number, userId: number) {
    // Get project
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new Error('Project not found.');
    }

    // Check if user is member of organization
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: project.organizationId,
        },
      },
    });

    if (!membership) {
      throw new Error(
        'Unauthorized. User is not a member of this organization.'
      );
    }

    // Delete project (cascades delete tasks)
    await prisma.project.delete({
      where: { id },
    });

    return { message: 'Project deleted successfully.' };
  }
  /**
   * Add user to project
   * Only org members can be added to project
   */

  /**
   * ============================================
   * Add Member to a project
   * ============================================
   */
  static async addProjectMember(
    projectId: number,
    userId: number,
    role: 'ADMIN' | 'LEAD' | 'MEMBER' | 'VIEWER',
    requestingUserId: number
  ) {
    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found.');
    }

    // Check if requester is project ADMIN
    const requesterRole = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: { userId: requestingUserId, projectId },
      },
    });

    if (!requesterRole || requesterRole.role !== 'ADMIN') {
      throw new Error('Unauthorized. Only project admins can add members.');
    }

    // Check if user is org member
    const orgMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: project.organizationId,
        },
      },
    });

    if (!orgMembership) {
      throw new Error(
        'User must be an organization member before adding to project.'
      );
    }

    // Add to project
    const projectMembership = await prisma.projectMembership.create({
      data: {
        userId,
        projectId,
        role,
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    return projectMembership;
  }

  /**
   * ============================================
   * GET PROJECT MEMBERS
   * ============================================
   */
  static async getProjectMembers(projectId: number) {
    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found.');
    }

    // Get all members in project
    const members = await prisma.projectMembership.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members;
  }

  /**
   * ============================================
   * UPDATE PROJECT MEMBER ROLE
   * ============================================
   */
  static async updateProjectMemberRole(
    projectId: number,
    userId: number,
    role: 'ADMIN' | 'LEAD' | 'MEMBER' | 'VIEWER',
    requestingUserId: number
  ) {
    // Check if requester is project ADMIN
    const requesterRole = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: { userId: requestingUserId, projectId },
      },
    });

    if (!requesterRole || requesterRole.role !== 'ADMIN') {
      throw new Error(
        'Unauthorized. Only project admins can update member roles.'
      );
    }

    // Get project membership
    const membership = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (!membership) {
      throw new Error('User is not a member of this project.');
    }

    // Update role
    const updatedMembership = await prisma.projectMembership.update({
      where: {
        userId_projectId: { userId, projectId },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedMembership;
  }

  /**
   * ============================================
   * REMOVE PROJECT MEMBER
   * ============================================
   */
  static async removeProjectMember(
    projectId: number,
    userId: number,
    requestingUserId: number
  ) {
    // Check if requester is project ADMIN
    const requesterRole = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: { userId: requestingUserId, projectId },
      },
    });

    if (!requesterRole || requesterRole.role !== 'ADMIN') {
      throw new Error('Unauthorized. Only project admins can remove members.');
    }

    // Get project membership
    const membership = await prisma.projectMembership.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (!membership) {
      throw new Error('User is not a member of this project.');
    }

    // Delete membership
    await prisma.projectMembership.delete({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    return { message: 'Project member removed successfully.' };
  }
}
