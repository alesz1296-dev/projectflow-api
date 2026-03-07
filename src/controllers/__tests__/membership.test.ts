import { Request, Response } from 'express';
import {
  addMember,
  removeMember,
  updateMemberRole,
  getOrganizationMembers,
  getUserMemberships,
  getMemberById,
} from '../membershipController';
import { MembershipService } from '../../services/membershipService';

jest.mock('../../services/membershipService');

describe('MembershipController', () => {
  let mockReq: any;
  let mockRes: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRes = { status: mockStatus, json: mockJson };
    mockReq = { body: {}, params: {}, user: { id: 1 } };
  });

  /**
   * ============================================
   * addMember - Success
   * ============================================
   */
  test('addMember should add member to organization', async () => {
    const mockMembership = {
      id: 1,
      userId: 2,
      organizationId: 1,
      role: 'MEMBER',
      user: {
        id: 2,
        email: 'newmember@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      },
      organization: {
        id: 1,
        name: 'Test Org',
      },
    };

    mockReq.params = { orgId: '1' };
    mockReq.body = { userId: 2, role: 'MEMBER' };
    mockReq.user = { id: 1 };

    (MembershipService.addMember as jest.Mock).mockResolvedValueOnce(
      mockMembership
    );

    await addMember(mockReq, mockRes);

    expect(MembershipService.addMember).toHaveBeenCalledWith(1, 2, 'MEMBER', 1);
    expect(mockStatus).toHaveBeenCalledWith(201);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: 'Member added successfully.',
      data: mockMembership,
    });
  });

  /**
   * ============================================
   * addMember - Unauthorized
   * ============================================
   */
  test('addMember should throw error if unauthorized', async () => {
    mockReq.params = { orgId: '1' };
    mockReq.body = { userId: 2, role: 'MEMBER' };
    mockReq.user = { id: 1 };

    (MembershipService.addMember as jest.Mock).mockRejectedValueOnce(
      new Error('Unauthorized. Only OWNER or ADMIN can add members.')
    );

    await expect(addMember(mockReq, mockRes)).rejects.toThrow(
      'Unauthorized. Only OWNER or ADMIN can add members.'
    );
  });

  /**
   * ============================================
   * addMember - Already Member
   * ============================================
   */
  test('addMember should throw error if user already member', async () => {
    mockReq.params = { orgId: '1' };
    mockReq.body = { userId: 2, role: 'MEMBER' };
    mockReq.user = { id: 1 };

    (MembershipService.addMember as jest.Mock).mockRejectedValueOnce(
      new Error('User is already a member of this organization.')
    );

    await expect(addMember(mockReq, mockRes)).rejects.toThrow(
      'User is already a member of this organization.'
    );
  });

  /**
   * ============================================
   * removeMember - Success
   * ============================================
   */
  test('removeMember should remove member from organization', async () => {
    mockReq.params = { orgId: '1', userId: '2' };
    mockReq.user = { id: 1 };

    (MembershipService.removeMember as jest.Mock).mockResolvedValueOnce({
      message: 'Member removed successfully.',
    });

    await removeMember(mockReq, mockRes);

    expect(MembershipService.removeMember).toHaveBeenCalledWith(1, 2, 1);
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: 'Member removed successfully.',
    });
  });

  /**
   * ============================================
   * removeMember - Cannot Remove Owner
   * ============================================
   */
  test('removeMember should throw error if trying to remove owner', async () => {
    mockReq.params = { orgId: '1', userId: '2' };
    mockReq.user = { id: 1 };

    (MembershipService.removeMember as jest.Mock).mockRejectedValueOnce(
      new Error('Cannot remove the organization OWNER.')
    );

    await expect(removeMember(mockReq, mockRes)).rejects.toThrow(
      'Cannot remove the organization OWNER.'
    );
  });

  /**
   * ============================================
   * updateMemberRole - Success
   * ============================================
   */
  test('updateMemberRole should update member role', async () => {
    const mockUpdatedMembership = {
      id: 1,
      userId: 2,
      organizationId: 1,
      role: 'ADMIN',
      user: {
        id: 2,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      organization: {
        id: 1,
        name: 'Test Org',
      },
    };

    mockReq.params = { orgId: '1', userId: '2' };
    mockReq.body = { role: 'ADMIN' };
    mockReq.user = { id: 1 };

    (MembershipService.updateMemberRole as jest.Mock).mockResolvedValueOnce(
      mockUpdatedMembership
    );

    await updateMemberRole(mockReq, mockRes);

    expect(MembershipService.updateMemberRole).toHaveBeenCalledWith(
      1,
      2,
      'ADMIN',
      1
    );
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: 'Member role updated successfully.',
      data: mockUpdatedMembership,
    });
  });

  /**
   * ============================================
   * updateMemberRole - Unauthorized
   * ============================================
   */
  test('updateMemberRole should throw error if not owner', async () => {
    mockReq.params = { orgId: '1', userId: '2' };
    mockReq.body = { role: 'ADMIN' };
    mockReq.user = { id: 1 };

    (MembershipService.updateMemberRole as jest.Mock).mockRejectedValueOnce(
      new Error('Unauthorized. Only OWNER can update member roles.')
    );

    await expect(updateMemberRole(mockReq, mockRes)).rejects.toThrow(
      'Unauthorized. Only OWNER can update member roles.'
    );
  });

  /**
   * ============================================
   * getOrganizationMembers - Success
   * ============================================
   */
  test('getOrganizationMembers should return all organization members', async () => {
    const mockMembers = [
      {
        id: 1,
        userId: 1,
        organizationId: 1,
        role: 'OWNER',
        user: {
          id: 1,
          email: 'owner@example.com',
          firstName: 'John',
          lastName: 'Doe',
          avatar: null,
        },
      },
      {
        id: 2,
        userId: 2,
        organizationId: 1,
        role: 'MEMBER',
        user: {
          id: 2,
          email: 'member@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          avatar: null,
        },
      },
    ];

    mockReq.params = { orgId: '1' };

    (
      MembershipService.getOrganizationMembers as jest.Mock
    ).mockResolvedValueOnce(mockMembers);

    await getOrganizationMembers(mockReq, mockRes);

    expect(MembershipService.getOrganizationMembers).toHaveBeenCalledWith(1);
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: 'Members retrieved successfully.',
      data: mockMembers,
    });
  });

  /**
   * ============================================
   * getOrganizationMembers - Empty
   * ============================================
   */
  test('getOrganizationMembers should return empty array', async () => {
    mockReq.params = { orgId: '1' };

    (
      MembershipService.getOrganizationMembers as jest.Mock
    ).mockResolvedValueOnce([]);

    await getOrganizationMembers(mockReq, mockRes);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: 'Members retrieved successfully.',
      data: [],
    });
  });

  /**
   * ============================================
   * getUserMemberships - Success
   * ============================================
   */
  test('getUserMemberships should return all user memberships', async () => {
    const mockMemberships = [
      {
        id: 1,
        userId: 1,
        organizationId: 1,
        role: 'OWNER',
        organization: {
          id: 1,
          name: 'My Company',
        },
      },
      {
        id: 2,
        userId: 1,
        organizationId: 2,
        role: 'MEMBER',
        organization: {
          id: 2,
          name: 'Partner Company',
        },
      },
    ];

    mockReq.user = { id: 1 };

    (MembershipService.getUserMemberships as jest.Mock).mockResolvedValueOnce(
      mockMemberships
    );

    await getUserMemberships(mockReq, mockRes);

    expect(MembershipService.getUserMemberships).toHaveBeenCalledWith(1);
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: 'User memberships retrieved successfully.',
      data: mockMemberships,
    });
  });

  /**
   * ============================================
   * getUserMemberships - Empty
   * ============================================
   */
  test('getUserMemberships should return empty array if no memberships', async () => {
    mockReq.user = { id: 1 };

    (MembershipService.getUserMemberships as jest.Mock).mockResolvedValueOnce(
      []
    );

    await getUserMemberships(mockReq, mockRes);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: 'User memberships retrieved successfully.',
      data: [],
    });
  });

  /**
   * ============================================
   * getMemberById - Success
   * ============================================
   */
  test('getMemberById should return member details', async () => {
    // ... rest of tests
  });
});
