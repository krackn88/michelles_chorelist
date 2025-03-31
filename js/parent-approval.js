/**
 * Parent Approval System for Family Chore Manager
 * Handles chore completion approval requests and notifications
 */

const parentApproval = {
    // Parent phone numbers
    parents: {
        mom: '15615968864',
        dad: '16062092345'
    },

    // Initialize the parent approval system
    init() {
        this.setupEventListeners();
        this.loadPendingApprovals();
    },

    // Set up event listeners
    setupEventListeners() {
        // Listen for chore completion requests
        document.addEventListener('choreCompletionRequested', (e) => {
            this.handleChoreCompletionRequest(e.detail);
        });
    },

    // Handle a new chore completion request
    async handleChoreCompletionRequest({ chore, completedBy }) {
        // Generate unique approval ID
        const approvalId = this.generateApprovalId();
        
        // Create approval request
        const approvalRequest = {
            id: approvalId,
            choreId: chore.id,
            choreTitle: chore.title,
            completedBy: completedBy,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        // Save to pending approvals
        this.savePendingApproval(approvalRequest);

        // Send SMS notifications to parents
        await this.sendApprovalRequests(approvalRequest);

        // Show pending message to child
        this.showPendingMessage(chore.id);
    },

    // Generate a unique approval ID
    generateApprovalId() {
        return 'approval_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Save a pending approval request
    savePendingApproval(approval) {
        const pendingApprovals = this.getPendingApprovals();
        pendingApprovals.push(approval);
        localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals));
    },

    // Get all pending approvals
    getPendingApprovals() {
        return JSON.parse(localStorage.getItem('pendingApprovals') || '[]');
    },

    // Send approval requests to parents
    async sendApprovalRequests(approval) {
        const message = this.formatApprovalMessage(approval);
        
        // Send to both parents
        for (const [parent, phone] of Object.entries(this.parents)) {
            await this.sendNotification(phone, message);
        }
    },

    // Format the approval message
    formatApprovalMessage(approval) {
        const baseUrl = window.location.origin;
        const approveUrl = `${baseUrl}/approve.html?id=${approval.id}&action=approve`;
        const denyUrl = `${baseUrl}/approve.html?id=${approval.id}&action=deny`;

        return `Chore Completion Request\n\n` +
               `Chore: ${approval.choreTitle}\n` +
               `Completed by: ${approval.completedBy}\n` +
               `Time: ${new Date(approval.timestamp).toLocaleString()}\n\n` +
               `Approve: ${approveUrl}\n` +
               `Deny: ${denyUrl}`;
    },

    // Show pending message to child
    showPendingMessage(choreId) {
        const choreElement = document.querySelector(`[data-chore-id="${choreId}"]`);
        if (choreElement) {
            const statusIndicator = choreElement.querySelector('.status-indicator');
            if (statusIndicator) {
                statusIndicator.innerHTML = `
                    <i class="fas fa-clock"></i>
                    <span>Waiting for parent approval...</span>
                `;
            }
        }
    },

    // Handle parent's approval response
    async handleApprovalResponse(approvalId, approved) {
        const pendingApprovals = this.getPendingApprovals();
        const approval = pendingApprovals.find(a => a.id === approvalId);

        if (!approval) {
            throw new Error('Approval request not found');
        }

        // Update approval status
        approval.status = approved ? 'approved' : 'denied';
        approval.responseTime = new Date().toISOString();

        // Save updated approval
        localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals));

        // Update chore completion status
        if (approved) {
            window.choreManager.toggleChoreCompletion(approval.choreId, approval.completedBy);
        }

        // Notify child of the decision
        this.notifyChild(approval);

        return approval;
    },

    // Notify child of parent's decision
    async notifyChild(approval) {
        const message = approval.status === 'approved' 
            ? `🎉 Great job! Your chore "${approval.choreTitle}" has been approved!`
            : `Please redo your chore "${approval.choreTitle}".`;

        // In a real implementation, this would send an SMS to the child's device
        // For now, we'll just show a notification in the UI
        window.utils.showNotification(message, approval.status === 'approved' ? 'success' : 'warning');
    },

    // Send SMS notification (placeholder for actual SMS implementation)
    async sendNotification(phoneNumber, message) {
        // In development, just log the message
        console.log(`Sending SMS to ${phoneNumber}:`, message);
        
        // In production, this would integrate with an SMS service
        // For now, we'll just show a notification in the UI
        window.utils.showNotification(
            `Notification sent to ${phoneNumber}`,
            'info'
        );
    }
};

// Initialize parent approval system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.parentApproval = parentApproval;
    parentApproval.init();
}); 