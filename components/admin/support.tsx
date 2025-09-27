"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Send,
} from "lucide-react";

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: "TECHNICAL" | "PAYMENT" | "SERVICE" | "ACCOUNT" | "OTHER";
  user: {
    id: string;
    name: string;
    email: string;
    role: "SEEKER" | "PROVIDER" | "ADMIN";
  };
  messages: Array<{
    id: string;
    content: string;
    sender: string;
    timestamp: string;
    isAdmin: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface ConversationParticipant {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  isTicketCreator?: boolean;
  isAssignedAdmin?: boolean;
  isBookingParticipant?: boolean;
  isMessageParticipant?: boolean;
}

interface ConversationMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    role: string;
    profileImage?: string;
  };
  receiver?: {
    id: string;
    name: string;
    role: string;
    profileImage?: string;
  };
  timestamp: string;
  isAdmin: boolean;
  isDirectMessage: boolean;
}

interface ConversationData {
  ticket: SupportTicket;
  participants: ConversationParticipant[];
  messages: ConversationMessage[];
  relatedBooking?: {
    id: string;
    service: {
      title: string;
      provider: ConversationParticipant;
    };
    customer: ConversationParticipant;
    status: string;
  };
}

function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [newMessage, setNewMessage] = useState("");
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [conversationData, setConversationData] =
    useState<ConversationData | null>(null);
  const [selectedReceiver, setSelectedReceiver] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch("/api/support-tickets");
        if (response.ok) {
          const data = await response.json();
          setTickets(data);
        } else {
          console.error("Failed to fetch support tickets");
          setTickets([]);
        }
      } catch (error) {
        console.error("Error fetching support tickets:", error);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    const variants: {
      [key: string]: "default" | "secondary" | "destructive" | "outline";
    } = {
      OPEN: "outline",
      IN_PROGRESS: "default",
      RESOLVED: "default",
      CLOSED: "secondary",
    };

    const icons = {
      OPEN: <AlertCircle className="h-3 w-3 mr-1" />,
      IN_PROGRESS: <Clock className="h-3 w-3 mr-1" />,
      RESOLVED: <CheckCircle className="h-3 w-3 mr-1" />,
      CLOSED: <XCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status]} className="flex items-center">
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: {
      [key: string]: "default" | "secondary" | "destructive" | "outline";
    } = {
      LOW: "outline",
      MEDIUM: "default",
      HIGH: "secondary",
      URGENT: "destructive",
    };

    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    setIsProcessing(ticketId);

    try {
      const response = await fetch(`/api/support-tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the ticket in the list
        setTickets((prev) =>
          prev.map((ticket) => (ticket.id === ticketId ? data : ticket))
        );

        // Show appropriate success message based on status
        const statusMessages = {
          OPEN: "Ticket reopened",
          IN_PROGRESS: "Work started on ticket",
          RESOLVED: "Ticket resolved successfully",
          CLOSED: "Ticket closed",
        };

        alert(
          statusMessages[newStatus as keyof typeof statusMessages] ||
            `Ticket status updated to ${newStatus}`
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to update ticket status");
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      alert("Failed to update ticket status. Please try again.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSendMessage = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setNewMessage("");
    setSelectedReceiver(null);
    setIsLoadingConversation(true);
    setIsMessageDialogOpen(true);

    try {
      // Fetch conversation data
      const response = await fetch(
        `/api/support-tickets/${ticket.id}/conversation`
      );
      if (response.ok) {
        const data = await response.json();
        setConversationData(data);
      } else {
        console.error("Failed to fetch conversation data");
        setConversationData(null);
      }
    } catch (error) {
      console.error("Error fetching conversation data:", error);
      setConversationData(null);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleMessageSubmit = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      const response = await fetch(
        `/api/support-tickets/${selectedTicket.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newMessage,
            receiverId: selectedReceiver || undefined,
            isPublic: !selectedReceiver,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Update conversation data with new message
        if (conversationData) {
          setConversationData((prev) =>
            prev
              ? {
                  ...prev,
                  messages: [...prev.messages, data.data],
                }
              : null
          );
        }

        // Update the ticket in the list
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === selectedTicket.id
              ? {
                  ...ticket,
                  messages: [
                    ...ticket.messages,
                    {
                      id: data.data.id,
                      content: data.data.content,
                      sender: data.data.sender.name,
                      timestamp: data.data.timestamp,
                      isAdmin: data.data.isAdmin,
                    },
                  ],
                  status: "IN_PROGRESS" as const,
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          )
        );

        setNewMessage("");
        setSelectedReceiver(null);
        alert("Message sent successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const openTickets = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
  ).length;
  const resolvedTickets = tickets.filter((t) => t.status === "RESOLVED").length;
  const urgentTickets = tickets.filter((t) => t.priority === "URGENT").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedTickets}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentTickets}</div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>Manage customer support requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{ticket.title}</h3>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        User: {ticket.user.name} ({ticket.user.role})
                      </span>
                      <span>Category: {ticket.category}</span>
                      <span>Messages: {ticket.messages.length}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                      {ticket.resolvedAt &&
                        ` • Resolved: ${new Date(
                          ticket.resolvedAt
                        ).toLocaleDateString()}`}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage(ticket)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>

                    {/* Status-specific action buttons */}
                    {ticket.status === "OPEN" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(ticket.id, "IN_PROGRESS")
                          }
                          disabled={isProcessing === ticket.id}
                          className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 border-blue-300"
                        >
                          {isProcessing === ticket.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent mr-1" />
                          ) : null}
                          Start Work
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(ticket.id, "RESOLVED")
                          }
                          disabled={isProcessing === ticket.id}
                          className="text-green-700 hover:text-green-800 hover:bg-green-50 border-green-300"
                        >
                          {isProcessing === ticket.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-700 border-t-transparent mr-1" />
                          ) : null}
                          Resolve
                        </Button>
                      </>
                    )}

                    {ticket.status === "IN_PROGRESS" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(ticket.id, "RESOLVED")
                          }
                          disabled={isProcessing === ticket.id}
                          className="text-green-700 hover:text-green-800 hover:bg-green-50 border-green-300"
                        >
                          {isProcessing === ticket.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-700 border-t-transparent mr-1" />
                          ) : null}
                          Resolve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(ticket.id, "CLOSED")
                          }
                          disabled={isProcessing === ticket.id}
                          className="text-gray-700 hover:text-gray-800 hover:bg-gray-50 border-gray-300"
                        >
                          {isProcessing === ticket.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-transparent mr-1" />
                          ) : null}
                          Close
                        </Button>
                      </>
                    )}

                    {ticket.status === "RESOLVED" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(ticket.id, "OPEN")}
                          disabled={isProcessing === ticket.id}
                          className="text-orange-700 hover:text-orange-800 hover:bg-orange-50 border-orange-300"
                        >
                          {isProcessing === ticket.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-700 border-t-transparent mr-1" />
                          ) : null}
                          Reopen
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(ticket.id, "CLOSED")
                          }
                          disabled={isProcessing === ticket.id}
                          className="text-gray-700 hover:text-gray-800 hover:bg-gray-50 border-gray-300"
                        >
                          {isProcessing === ticket.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-transparent mr-1" />
                          ) : null}
                          Close
                        </Button>
                      </>
                    )}

                    {ticket.status === "CLOSED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(ticket.id, "OPEN")}
                        disabled={isProcessing === ticket.id}
                        className="text-orange-700 hover:text-orange-800 hover:bg-orange-50 border-orange-300"
                      >
                        {isProcessing === ticket.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-700 border-t-transparent mr-1" />
                        ) : null}
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTickets.length === 0 && (
            <p className="text-center text-gray-500 py-8">No tickets found.</p>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Conversation Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Support Conversation
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.title} - Mediating between participants
            </DialogDescription>
          </DialogHeader>

          {isLoadingConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading conversation...</p>
              </div>
            </div>
          ) : conversationData ? (
            <div className="flex-1 flex gap-4 min-h-0">
              {/* Participants Panel */}
              <div className="w-64 border-r pr-4">
                <h3 className="font-medium mb-3">Participants</h3>
                <div className="space-y-2">
                  {conversationData.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`p-2 rounded-lg border ${
                        selectedReceiver === participant.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {participant.profileImage ? (
                            <img
                              src={participant.profileImage}
                              alt={participant.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium">
                              {participant.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {participant.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {participant.role}
                          </p>
                        </div>
                      </div>
                      {participant.isTicketCreator && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            Ticket Creator
                          </Badge>
                        </div>
                      )}
                      {participant.isBookingParticipant && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Booking Participant
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {conversationData.relatedBooking && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">
                      Related Booking
                    </h4>
                    <p className="text-xs text-gray-600 mb-1">
                      Service: {conversationData.relatedBooking.service.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      Status: {conversationData.relatedBooking.status}
                    </p>
                  </div>
                )}
              </div>

              {/* Messages Panel */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Messages */}
                <div className="flex-1 border rounded-lg p-4 overflow-y-auto mb-4">
                  <div className="space-y-3">
                    {conversationData.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isAdmin ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-md px-3 py-2 rounded-lg ${
                            message.isAdmin
                              ? "bg-blue-500 text-white"
                              : message.isDirectMessage
                              ? "bg-orange-100 border border-orange-200"
                              : "bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                              {message.sender.profileImage ? (
                                <img
                                  src={message.sender.profileImage}
                                  alt={message.sender.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-xs">
                                  {message.sender.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium">
                              {message.sender.name}
                            </span>
                            {message.isDirectMessage && message.receiver && (
                              <span className="text-xs opacity-70">
                                → {message.receiver.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Send to:</span>
                    <Select
                      value={selectedReceiver || "all"}
                      onValueChange={(value) =>
                        setSelectedReceiver(value === "all" ? null : value)
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Participants</SelectItem>
                        {conversationData.participants
                          .filter((p) => p.role !== "ADMIN")
                          .map((participant) => (
                            <SelectItem
                              key={participant.id}
                              value={participant.id}
                            >
                              {participant.name} ({participant.role})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder={
                        selectedReceiver
                          ? "Type a private message..."
                          : "Type your message to all participants..."
                      }
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                      rows={3}
                    />
                    <Button
                      onClick={handleMessageSubmit}
                      disabled={!newMessage.trim()}
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Failed to load conversation data</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsMessageDialogOpen(false);
                setConversationData(null);
                setSelectedReceiver(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminSupport;
