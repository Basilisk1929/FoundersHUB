import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/mongodb';
import { ensureSeedData } from '@/lib/db/seed';
import { UserDoc, DeveloperProfile, PastProject, ContributionDay } from '@/types';

function generateDefaultHeatmap(): ContributionDay[] {
  const days: ContributionDay[] = [];
  const today = new Date();
  
  // 52 weeks = 364 days
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Create organic activity patterns (more active on weekdays)
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const seed = (d.getDate() * 17 + d.getMonth() * 31 + (isWeekend ? 3 : 11)) % 100;
    
    let count = 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    
    if (seed > 82) {
      count = Math.floor((seed % 6) + 5);
      level = 4;
    } else if (seed > 60) {
      count = Math.floor((seed % 4) + 3);
      level = 3;
    } else if (seed > 35) {
      count = Math.floor((seed % 3) + 1);
      level = 2;
    } else if (seed > 20) {
      count = 1;
      level = 1;
    }
    
    days.push({ date: dateStr, count, level });
  }
  return days;
}

function getDefaultProfile(user: UserDoc): DeveloperProfile {
  return {
    handle: user.name.toLowerCase().replace(/\s+/g, ''),
    headline: 'Senior Full-Stack & Distributed Systems Engineer',
    location: 'Bengaluru, India',
    githubUsername: 'priyasharma-dev',
    codechefUsername: 'priya_coder',
    linkedinUrl: 'https://linkedin.com/in/priyasharma-dev',
    websiteUrl: 'https://priyasharma.engineer',
    rating: 2184,
    starsRating: 5,
    globalRank: 142,
    countryRank: 28,
    division: 'Division 1',
    streakDays: 19,
    longestStreak: 48,
    resumeUrl: 'https://files.foundershub.dev/resumes/priya-sharma-resume.pdf',
    resumeFilename: 'Priya_Sharma_Resume.pdf',
    resumeLastUpdated: '2026-09-08',
    resumeSummary: 'Systems engineer with 5+ years of production experience in Kubernetes controllers, high-throughput distributed message queues, and low-latency WebSockets in Go & TypeScript.',
    pastProjects: [
      {
        id: 'proj_ebpf_watch',
        title: 'ebpf-cluster-watch',
        description: 'Low-overhead Linux eBPF telemetry daemon capturing socket anomalies, packet drops, and thread contention in Kubernetes nodes.',
        techStack: ['Go', 'eBPF', 'C', 'Kubernetes', 'Prometheus'],
        primaryLanguage: 'Go',
        languageColor: '#00ADD8',
        stars: 348,
        forks: 52,
        liveUrl: 'https://ebpf-watch.dev',
        githubUrl: 'https://github.com/priyasharma-dev/ebpf-cluster-watch',
        role: 'Creator & Lead Maintainer',
        stats: '12k+ Docker pulls, 4 production adopters',
        isPinned: true,
        completedAt: '2026-06'
      },
      {
        id: 'proj_raft_consensus',
        title: 'raft-distributed-consensus',
        description: 'Deterministic implementation of the Raft consensus algorithm with dynamic cluster membership changes and log snapshotting.',
        techStack: ['Rust', 'Async-std', 'gRPC', 'Protobuf'],
        primaryLanguage: 'Rust',
        languageColor: '#DEA584',
        stars: 512,
        forks: 64,
        liveUrl: 'https://raft-rs.dev',
        githubUrl: 'https://github.com/priyasharma-dev/raft-distributed-consensus',
        role: 'Architect',
        stats: 'Zero deadlocks under Jepsen chaos testing',
        isPinned: true,
        completedAt: '2026-03'
      },
      {
        id: 'proj_turbopack_saas',
        title: 'turbopack-enterprise-starter',
        description: 'Full-stack Next.js 16 App Router boilerplate featuring strict RBAC, automated micro-sprint tracking, and dynamic equity point ledgers.',
        techStack: ['TypeScript', 'Next.js', 'TailwindCSS', 'MongoDB'],
        primaryLanguage: 'TypeScript',
        languageColor: '#3178C6',
        stars: 820,
        forks: 130,
        liveUrl: 'https://turbopack-starter.dev',
        githubUrl: 'https://github.com/priyasharma-dev/turbopack-enterprise-starter',
        role: 'Lead Developer',
        stats: 'Featured on Next.js ecosystem showcase',
        isPinned: true,
        completedAt: '2026-08'
      },
      {
        id: 'proj_pod_scaler',
        title: 'k8s-pod-autoscaler-crds',
        description: 'Custom Kubernetes controller that adjusts pod vertical resource requests based on 99th percentile response latency.',
        techStack: ['Go', 'Kubernetes client-go', 'Grafana'],
        primaryLanguage: 'Go',
        languageColor: '#00ADD8',
        stars: 215,
        forks: 31,
        liveUrl: 'https://k8s-scaler.io',
        githubUrl: 'https://github.com/priyasharma-dev/k8s-pod-autoscaler-crds',
        role: 'Core Author',
        stats: '30% average cloud bill reduction in staging',
        isPinned: true,
        completedAt: '2026-05'
      }
    ],
    experience: [
      {
        id: 'exp_1',
        company: 'KubeScale AI (via FoundersHub)',
        role: 'Core Infrastructure Lead',
        period: 'Aug 2026 - Present',
        description: 'Leading sprint delivery for autonomous Kubernetes pod autoscaling and eBPF kernel telemetry. Built the custom CRD controller in Go.',
        skills: ['Kubernetes', 'Go', 'eBPF', 'Prometheus']
      },
      {
        id: 'exp_2',
        company: 'Stripe',
        role: 'Senior Software Engineer (Payments Infrastructure)',
        period: '2023 - 2026',
        description: 'Scaled global checkout API processing $12B+ annually. Optimized p99 latency by 34ms using distributed caching and connection multiplexing.',
        skills: ['Distributed Systems', 'Ruby', 'Java', 'gRPC', 'Redis']
      }
    ],
    education: [
      {
        id: 'edu_1',
        institution: 'Indian Institute of Technology, Madras (IIT-M)',
        degree: 'B.Tech in Computer Science and Engineering',
        year: '2019 - 2023',
        grade: 'CGPA 9.4 / 10.0 (Institute Merit Scholar)'
      }
    ],
    badges: [
      {
        id: 'badge_5star',
        name: '5-Star Competitive Coder',
        description: 'Maintained 2100+ Elo rating in CodeChef algorithms contests.',
        icon: 'Award',
        category: 'code',
        unlockedAt: '2026-07-15'
      },
      {
        id: 'badge_sprint_master',
        name: 'High-Velocity Finisher',
        description: 'Completed 5 consecutive 21-day startup execution sprints with 95%+ completion.',
        icon: 'Zap',
        category: 'sprint',
        unlockedAt: '2026-08-30'
      },
      {
        id: 'badge_equity_leader',
        name: 'Top 1% Equity Earner',
        description: 'Accrued over 200 contribution points in active venture backlogs.',
        icon: 'TrendingUp',
        category: 'equity',
        unlockedAt: '2026-09-02'
      }
    ],
    languageStats: {
      'TypeScript': 42,
      'Go': 28,
      'Rust': 18,
      'Python': 12
    },
    difficultySolved: {
      easy: 48,
      medium: 34,
      hard: 14,
      critical: 8
    },
    contributionHeatmap: generateDefaultHeatmap()
  };
}

export async function GET(req: NextRequest) {
  try {
    await ensureSeedData();
    const searchParams = req.nextUrl.searchParams;
    const requestedUserId = searchParams.get('userId');

    let targetUserId = requestedUserId;
    if (!targetUserId) {
      const session = await getCurrentUser();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      targetUserId = session.userId;
    }

    const db = await getDb();
    const usersCol = db.collection<UserDoc>('users');
    const user = await usersCol.findOne({ _id: targetUserId });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Merge existing profile or synthesize default
    let profile = user.developerProfile;
    if (!profile || !profile.pastProjects || profile.pastProjects.length === 0) {
      profile = getDefaultProfile(user);
      // Persist the initialized profile
      await usersCol.updateOne({ _id: user._id }, { $set: { developerProfile: profile } });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        bio: user.bio,
        skills: user.skills || [],
        totalPoints: user.totalPoints || 0
      },
      profile
    });
  } catch (error: any) {
    console.error('Developer Profile GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch developer profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body = await req.json();

    const db = await getDb();
    const usersCol = db.collection<UserDoc>('users');
    const existingUser = await usersCol.findOne({ _id: user.userId });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentProfile: DeveloperProfile = existingUser.developerProfile || getDefaultProfile(existingUser);

    // Merge updates into profile
    const updatedProfile: DeveloperProfile = {
      ...currentProfile,
      ...(body.handle !== undefined && { handle: String(body.handle).trim().toLowerCase() }),
      ...(body.headline !== undefined && { headline: String(body.headline).trim() }),
      ...(body.location !== undefined && { location: String(body.location).trim() }),
      ...(body.githubUsername !== undefined && { githubUsername: String(body.githubUsername).trim() }),
      ...(body.codechefUsername !== undefined && { codechefUsername: String(body.codechefUsername).trim() }),
      ...(body.linkedinUrl !== undefined && { linkedinUrl: String(body.linkedinUrl).trim() }),
      ...(body.websiteUrl !== undefined && { websiteUrl: String(body.websiteUrl).trim() }),
      ...(body.resumeUrl !== undefined && { resumeUrl: String(body.resumeUrl).trim() }),
      ...(body.resumeFilename !== undefined && { resumeFilename: String(body.resumeFilename).trim() }),
      ...(body.resumeSummary !== undefined && { resumeSummary: String(body.resumeSummary).trim() }),
      ...(body.resumeLastUpdated !== undefined && { resumeLastUpdated: String(body.resumeLastUpdated) }),
      ...(Array.isArray(body.pastProjects) && { pastProjects: body.pastProjects }),
      ...(Array.isArray(body.experience) && { experience: body.experience }),
      ...(Array.isArray(body.education) && { education: body.education }),
      ...(body.languageStats && { languageStats: body.languageStats }),
      ...(body.difficultySolved && { difficultySolved: body.difficultySolved }),
      ...(body.rating !== undefined && { rating: Number(body.rating) }),
      ...(body.starsRating !== undefined && { starsRating: Number(body.starsRating) }),
      ...(body.globalRank !== undefined && { globalRank: Number(body.globalRank) }),
      ...(body.division !== undefined && { division: String(body.division) })
    };

    // If new past project was sent specifically
    if (body.action === 'add_project' && body.project) {
      const newProj: PastProject = {
        id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: body.project.title || 'Untitled Project',
        description: body.project.description || '',
        techStack: Array.isArray(body.project.techStack) ? body.project.techStack : ['TypeScript'],
        primaryLanguage: body.project.primaryLanguage || 'TypeScript',
        languageColor: body.project.languageColor || '#3178C6',
        stars: Number(body.project.stars) || 0,
        forks: Number(body.project.forks) || 0,
        liveUrl: body.project.liveUrl || '',
        githubUrl: body.project.githubUrl || '',
        role: body.project.role || 'Creator',
        stats: body.project.stats || '',
        isPinned: body.project.isPinned !== false,
        completedAt: body.project.completedAt || new Date().toISOString().slice(0, 7)
      };
      updatedProfile.pastProjects = [newProj, ...(updatedProfile.pastProjects || [])];
    }

    // If delete past project was sent
    if (body.action === 'delete_project' && body.projectId) {
      updatedProfile.pastProjects = (updatedProfile.pastProjects || []).filter(p => p.id !== body.projectId);
    }

    // If toggle pin was sent
    if (body.action === 'toggle_pin' && body.projectId) {
      updatedProfile.pastProjects = (updatedProfile.pastProjects || []).map(p => 
        p.id === body.projectId ? { ...p, isPinned: !p.isPinned } : p
      );
    }

    // Also sync bio and skills to the parent UserDoc if provided
    const userUpdateFields: Partial<UserDoc> = {
      developerProfile: updatedProfile
    };
    if (body.bio !== undefined) userUpdateFields.bio = String(body.bio);
    if (Array.isArray(body.skills)) userUpdateFields.skills = body.skills;

    await usersCol.updateOne({ _id: user.userId }, { $set: userUpdateFields });

    return NextResponse.json({
      success: true,
      message: 'Developer profile updated successfully',
      profile: updatedProfile
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Developer Profile PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update developer profile' }, { status: 500 });
  }
}
