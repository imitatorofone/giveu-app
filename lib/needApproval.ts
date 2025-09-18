export async function handleNeedApproval(needId: string, orgId: string) {
  try {
    const response = await fetch(`/api/needs/${needId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // You can replace this with your preferred toast library
      alert(`Need approved! ${result.matchCount} people were notified.`);
      return result;
    } else {
      throw new Error(result.error || 'Failed to approve need');
    }
  } catch (error) {
    console.error('Error approving need:', error);
    alert('Failed to approve need');
    throw error;
  }
}

// Simple engagement scoring function
export function getEngagementScore(level: string): number {
  switch (level) {
    case 'lead': return 3;
    case 'help': return 2;  
    case 'learn': return 1;
    default: return 1;
  }
}
