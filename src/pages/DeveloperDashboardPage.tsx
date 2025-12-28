import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useDeveloperMessages, DeveloperMessage, MessageStatus } from '@/hooks/useDeveloperMessages';
import { useReports, Report, ReportStatus } from '@/hooks/useReports';
import ChangeUserRoleForm from '@/components/forms/ChangeUserRoleForm';
import { toast } from 'sonner';
import { MessageSquare, AlertTriangle, Users, Code } from 'lucide-react';

const DeveloperDashboardPage = () => {
  const { user, userProfile } = useAuth();
  const { messages, isLoading: isMessagesLoading, error: messagesError, refetch: refetchMessages, updateMessageStatus } = useDeveloperMessages();
  const { reports, isLoading: isReportsLoading, error: reportsError, refetch: refetchReports, updateReportStatus } = useReports();

  const [activeTab, setActiveTab] = useState("messages");
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<DeveloperMessage | null>(null);
  const [messageResponse, setMessageResponse] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportStatus, setReportStatus] = useState<ReportStatus>("Reviewed");

  if (!userProfile?.isDeveloper) {
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        You do not have permission to access the Developer Dashboard.
      </div>
    );
  }

  const handleUpdateMessageStatus = async (newStatus: MessageStatus) => {
    if (!selectedMessage || !user) return;
    try {
      await updateMessageStatus(selectedMessage.$id, newStatus, messageResponse);
      toast.success("Message status updated!");
      setSelectedMessage(null);
      setMessageResponse("");
      refetchMessages();
    } catch (error) {
      console.error("Failed to update message status:", error);
      toast.error("Failed to update message status.");
    }
  };

  const handleUpdateReportStatus = async () => {
    if (!selectedReport || !user) return;
    try {
      await updateReportStatus(selectedReport.$id, reportStatus, user.$id);
      toast.success("Report status updated!");
      setSelectedReport(null);
      setReportStatus("Reviewed");
      refetchReports();
    } catch (error) {
      console.error("Failed to update report status:", error);
      toast.error("Failed to update report status.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground flex items-center gap-2">
        <Code className="h-8 w-8" /> Developer Dashboard
      </h1>

      <div className="flex justify-end mb-4">
        <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
          <DialogTrigger asChild>
            <Button>Change User Role</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Assign developer or ambassador roles to users.
              </DialogDescription>
            </DialogHeader>
            <ChangeUserRoleForm onRoleChanged={() => {
              setIsChangeRoleDialogOpen(false);
              // Potentially refetch user profiles if needed
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" /> User Messages ({messages.filter(m => m.status === "Pending").length})
          </TabsTrigger>
          <TabsTrigger value="reports">
            <AlertTriangle className="h-4 w-4 mr-2" /> Reports ({reports.filter(r => r.status === "Pending").length})
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Users className="h-4 w-4 mr-2" /> Admin Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">User Messages</h2>
          {isMessagesLoading ? (
            <div className="text-center py-4">Loading messages...</div>
          ) : messagesError ? (
            <div className="text-center py-4 text-red-500">Error: {messagesError}</div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground">No messages from users.</p>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => (
                <Card key={msg.$id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{msg.senderName} ({msg.collegeName})</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(msg.$createdAt).toLocaleString()} - Status: <span className={`font-medium ${msg.status === "Pending" ? "text-yellow-500" : "text-green-500"}`}>{msg.status}</span>
                      </p>
                    </div>
                    {msg.status === "Pending" && (
                      <Button size="sm" onClick={() => setSelectedMessage(msg)}>
                        Review
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{msg.message}</p>
                    {msg.response && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="font-semibold text-sm">Your Response:</p>
                        <p className="text-sm text-muted-foreground">{msg.response}</p>
                        <p className="text-xs text-muted-foreground mt-1">Responded by {msg.respondedBy} on {new Date(msg.respondedAt!).toLocaleDateString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">User Reports</h2>
          {isReportsLoading ? (
            <div className="text-center py-4">Loading reports...</div>
          ) : reportsError ? (
            <div className="text-center py-4 text-red-500">Error: {reportsError}</div>
          ) : reports.length === 0 ? (
            <p className="text-center text-muted-foreground">No reports from users.</p>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <Card key={report.$id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.reporterName} ({report.collegeName})</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.$createdAt).toLocaleString()} - Status: <span className={`font-medium ${report.status === "Pending" ? "text-yellow-500" : "text-green-500"}`}>{report.status}</span>
                      </p>
                    </div>
                    {report.status === "Pending" && (
                      <Button size="sm" onClick={() => setSelectedReport(report)}>
                        Review
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      <span className="font-semibold">Reason:</span> {report.reason} <br />
                      <span className="font-semibold">Listing Type:</span> {report.listingType} (ID: {report.listingId}) <br />
                      {report.description && <><span className="font-semibold">Description:</span> {report.description}</>}
                    </p>
                    {report.reviewedBy && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="font-semibold text-sm">Reviewed By:</p>
                        <p className="text-sm text-muted-foreground">{report.reviewedBy} on {new Date(report.reviewedAt!).toLocaleDateString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tools" className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Admin Tools</h2>
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Use this tool to change user roles (e.g., make someone a developer or ambassador).
              </p>
              <Button onClick={() => setIsChangeRoleDialogOpen(true)}>Open Role Changer</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Message Review Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Review Message from {selectedMessage?.senderName}</DialogTitle>
            <DialogDescription>
              Message: {selectedMessage?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="messageResponse">Your Response (Optional)</Label>
              <Textarea
                id="messageResponse"
                value={messageResponse}
                onChange={(e) => setMessageResponse(e.target.value)}
                placeholder="Type your response here..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedMessage(null)}>Cancel</Button>
            <Button onClick={() => handleUpdateMessageStatus("Resolved")}>Mark as Resolved</Button>
            <Button variant="destructive" onClick={() => handleUpdateMessageStatus("Archived")}>Archive</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Review Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Review Report from {selectedReport?.reporterName}</DialogTitle>
            <DialogDescription>
              Reason: {selectedReport?.reason} <br />
              Listing Type: {selectedReport?.listingType} (ID: {selectedReport?.listingId})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reportStatus">Update Status</Label>
              <Select value={reportStatus} onValueChange={(value: ReportStatus) => setReportStatus(value)}>
                <SelectTrigger id="reportStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                  <SelectItem value="Dismissed">Dismissed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem> {/* Allow setting back to pending if needed */}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>Cancel</Button>
            <Button onClick={handleUpdateReportStatus}>Save Status</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeveloperDashboardPage;