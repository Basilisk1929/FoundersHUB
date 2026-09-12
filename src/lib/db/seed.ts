import bcrypt from 'bcryptjs';
import { getDb } from './mongodb';
import { 
  UserDoc, 
  StartupDoc, 
  SprintDoc, 
  DepartmentDoc, 
  TaskDoc, 
  TimelineEventDoc, 
  ExpenseDoc,
  FundingRequestDoc,
  ApplicationDoc 
} from '@/types';

export async function ensureSeedData() {
  const db = await getDb();
  const usersCol = db.collection<UserDoc>('users');
  const count = await usersCol.countDocuments();
  const passwordHash = await bcrypt.hash('Password123!', 10);

  if (count > 0) {
    // Ensure the default admin accounts exist and are linked to ventures
    const founderUser = await usersCol.findOne({ email: 'founder@founderhub.com' });
    if (!founderUser) {
      await usersCol.updateOne({ _id: 'usr_founder_alex' }, { $set: { email: 'founder@founderhub.com', name: 'Alex Rivera' } });
    }
    const devUser = await usersCol.findOne({ email: 'developer@founderhub.com' });
    if (!devUser) {
      await usersCol.updateOne({ _id: 'usr_dev_priya' }, { $set: { email: 'developer@founderhub.com', name: 'Priya Sharma' } });
    }

    // Ensure developer profile with GitHub/CodeChef metrics is populated
    const priyaUser = await usersCol.findOne({ _id: 'usr_dev_priya' });
    if (priyaUser && (!priyaUser.developerProfile || !priyaUser.developerProfile.pastProjects)) {
      await usersCol.updateOne(
        { _id: 'usr_dev_priya' },
        {
          $set: {
            developerProfile: {
              handle: 'priyasharma',
              headline: 'Senior Full-Stack & Distributed Systems Engineer | ex-Stripe',
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
                TypeScript: 42,
                Go: 28,
                Rust: 18,
                Python: 12
              },
              difficultySolved: {
                easy: 48,
                medium: 34,
                hard: 14,
                critical: 8
              }
            }
          }
        }
      );
    }

    const invUser = await usersCol.findOne({ email: 'investor@founderhub.com' });
    if (!invUser) {
      await usersCol.updateOne({ _id: 'usr_investor_vikram' }, { $set: { email: 'investor@founderhub.com', name: 'Vikram Mehta' } });
    }

    // Ensure sample startups have pitch videos, decks, and image assets
    const startupsCol = db.collection<StartupDoc>('startups');
    await startupsCol.updateOne(
      { _id: 'stp_kubescale' },
      { 
        $set: { 
          pitchVideoUrl: 'https://www.youtube.com/watch?v=M576WGiDBdQ',
          pitchDeckUrl: 'https://docs.google.com/presentation/d/1gL6Gg0q9y1d2s3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o/edit',
          images: [
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'
          ]
        } 
      }
    );
    await startupsCol.updateOne(
      { _id: 'stp_neuroflow' },
      { 
        $set: { 
          pitchVideoUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
          pitchDeckUrl: 'https://docs.google.com/presentation/d/1yZ2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t/edit',
          images: [
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop&q=80'
          ]
        } 
      }
    );
    return;
  }

  console.log('[Seed] Seeding initial database records with default admin accounts...');

  // 1. Seed Users
  const alexFounderId = 'usr_founder_alex';
  const priyaDevId = 'usr_dev_priya';
  const marcusDevId = 'usr_dev_marcus';
  const vikramInvestorId = 'usr_investor_vikram';

  const users: UserDoc[] = [
    {
      _id: alexFounderId,
      name: 'Alex Rivera',
      email: 'founder@founderhub.com',
      passwordHash,
      role: 'founder',
      bio: 'Serial builder, 2x founder, AI product architect. Passionate about high-velocity execution.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      theme: 'dark',
      identityVerificationStatus: 'verified',
      identityDetails: {
        idType: 'pan',
        idLast4: '8821',
        documentName: 'PAN_Alex_Rivera.pdf',
        attestedAt: '2026-08-15T10:00:00Z'
      },
      createdAt: '2026-08-10T10:00:00Z'
    },
    {
      _id: priyaDevId,
      name: 'Priya Sharma',
      email: 'developer@founderhub.com',
      passwordHash,
      role: 'developer',
      bio: 'Senior Full-Stack & Distributed Systems Engineer. Open source contributor.',
      skills: ['Next.js', 'TypeScript', 'Node.js', 'Go', 'Tailwind CSS', 'PostgreSQL', 'Docker'],
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      theme: 'dark',
      identityVerificationStatus: 'verified',
      identityDetails: {
        idType: 'aadhaar',
        idLast4: '4190',
        documentName: 'Aadhaar_Priya_Sharma.pdf',
        attestedAt: '2026-08-18T14:30:00Z'
      },
      totalPoints: 210,
      createdAt: '2026-08-12T11:00:00Z'
    },
    {
      _id: marcusDevId,
      name: 'Marcus Vance',
      email: 'marcus@builder.dev',
      passwordHash,
      role: 'developer',
      bio: 'Lead Product & UI/UX Designer. Focusing on interactive micro-animations and intuitive workflows.',
      skills: ['Figma', 'UI/UX Design', 'Design Systems', 'CSS/Tailwind', 'Prototyping'],
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      theme: 'dark',
      identityVerificationStatus: 'self_attested',
      totalPoints: 130,
      createdAt: '2026-08-14T09:00:00Z'
    },
    {
      _id: vikramInvestorId,
      name: 'Vikram Mehta',
      email: 'investor@founderhub.com',
      passwordHash,
      role: 'investor',
      bio: 'Managing Partner at Peak Horizon Ventures. Writing $50k-$500k cheques for proof-backed execution teams.',
      sectorsOfInterest: ['AI / ML', 'DevTools', 'Fintech', 'HealthTech', 'CleanTech'],
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      theme: 'dark',
      identityVerificationStatus: 'verified',
      createdAt: '2026-08-15T12:00:00Z'
    }
  ];
  await usersCol.insertMany(users);

  // 2. Seed Startups
  const startupsCol = db.collection<StartupDoc>('startups');
  const sprintsCol = db.collection<SprintDoc>('sprints');
  const departmentsCol = db.collection<DepartmentDoc>('departments');
  const tasksCol = db.collection<TaskDoc>('tasks');
  const timelineCol = db.collection<TimelineEventDoc>('timeline');
  const expensesCol = db.collection<ExpenseDoc>('expenses');
  const fundingCol = db.collection<FundingRequestDoc>('fundingRequests');
  const applicationsCol = db.collection<ApplicationDoc>('applications');

  const startup1Id = 'stp_kubescale';
  const startup2Id = 'stp_neuroflow';
  const startup3Id = 'stp_greenpulse';

  const sprint1Id = 'spr_kubescale_active';
  const sprint2Id = 'spr_neuroflow_completed';

  const startups: StartupDoc[] = [
    {
      _id: startup1Id,
      founderId: alexFounderId,
      founderName: 'Alex Rivera',
      name: 'KubeScale AI',
      tagline: 'Autonomous Kubernetes cluster optimization & dynamic cloud cost reduction',
      description: 'KubeScale deploys low-overhead eBPF probes inside Kubernetes clusters to observe real-time CPU/memory utilization and right-sizes pods dynamically without causing throttling or cold starts.',
      problemStatement: 'Modern cloud teams waste 35-50% of their AWS/GCP bill on over-provisioned idle Kubernetes compute because manual HPA thresholds are fragile and terrifying to tweak.',
      validationEvidence: '3 pilot LOIs signed with mid-market DevOps teams; preliminary benchmarks showed a 42% cost reduction in simulated workloads; 48 developer survey responses validate pain point.',
      sector: 'DevTools & Cloud Infrastructure',
      tags: ['Kubernetes', 'eBPF', 'DevOps', 'Cloud Cost', 'AI'],
      stage: 'sprint_active',
      proposedEquitySplit: { 'Alex Rivera (Founder)': 60, 'Builders Pool': 30, 'Advisors': 10 },
      images: [
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'
      ],
      pitchDeckUrl: 'https://docs.google.com/presentation/d/1gL6Gg0q9y1d2s3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o/edit',
      pitchVideoUrl: 'https://www.youtube.com/watch?v=M576WGiDBdQ',
      visibility: 'public',
      executionScore: 78,
      activeSprintId: sprint1Id,
      ownershipHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      ownershipTimestamp: '2026-08-20T10:00:00Z',
      createdAt: '2026-08-20T10:00:00Z'
    },
    {
      _id: startup2Id,
      founderId: alexFounderId,
      founderName: 'Alex Rivera',
      name: 'NeuroFlow Health',
      tagline: 'Ambient clinical documentation & EHR sync for outpatient clinics',
      description: 'NeuroFlow captures clinical consultations through ambient microphone listening, structures physician notes into standard SOAP formats, and syncs directly with Epic and Cerner.',
      problemStatement: 'Primary care physicians spend an average of 2.5 hours every evening doing manual EHR data entry ("pajama time"), resulting in 63% physician burnout rates.',
      validationEvidence: 'Conducted 14 in-depth clinical shadowing sessions; 12 independent clinic doctors committed to 30-day trial; IRB exemption approved; HIPAA compliance architecture peer-reviewed.',
      sector: 'HealthTech & AI',
      tags: ['HealthTech', 'Ambient AI', 'Speech-to-Text', 'EHR', 'HIPAA'],
      stage: 'sprint_completed',
      proposedEquitySplit: { 'Alex Rivera (Founder)': 55, 'Priya Sharma (Tech)': 25, 'Marcus Vance (Design)': 12, 'Advisors': 8 },
      vestedEquitySplit: { 'Alex Rivera (Founder)': 55, 'Priya Sharma (Tech)': 25, 'Marcus Vance (Design)': 12, 'Advisors': 8 },
      images: [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop&q=80'
      ],
      pitchDeckUrl: 'https://docs.google.com/presentation/d/1yZ2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t/edit',
      pitchVideoUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
      visibility: 'public',
      executionScore: 89,
      activeSprintId: sprint2Id,
      totalFundedAmount: 250000,
      brandingPartnerships: [
        {
          investorId: vikramInvestorId,
          brandName: 'Peak Horizon Ventures',
          brandingLogoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
          sponsorshipDurationDays: 90,
          startsAt: '2026-09-01T00:00:00Z',
          expiresAt: '2026-11-30T23:59:59Z'
        }
      ],
      ownershipHash: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
      ownershipTimestamp: '2026-08-01T09:00:00Z',
      createdAt: '2026-08-01T09:00:00Z'
    },
    {
      _id: startup3Id,
      founderId: alexFounderId,
      founderName: 'Alex Rivera',
      name: 'GreenPulse Energy',
      tagline: 'Decentralized micro-grid energy balancing and tokenized P2P trading',
      description: 'GreenPulse enables residential solar producers to trade surplus kilowatt hours with nearby neighbors over a local microgrid network.',
      problemStatement: 'Solar homeowners sell excess power back to monopolies at wholesale rates (3c/kWh) while neighbors pay retail (18c/kWh) for the same electrons.',
      validationEvidence: 'Initial research and neighborhood survey conducted in 2 residential communities.',
      sector: 'CleanTech & Energy',
      tags: ['Solar', 'CleanEnergy', 'IoT', 'P2P'],
      stage: 'draft',
      proposedEquitySplit: { 'Founder': 70, 'Pool': 30 },
      images: ['https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80'],
      visibility: 'private',
      executionScore: 25,
      createdAt: '2026-09-05T14:00:00Z'
    }
  ];
  await startupsCol.insertMany(startups);

  // 3. Seed Sprints
  const sprints: SprintDoc[] = [
    {
      _id: sprint1Id,
      startupId: startup1Id,
      durationDays: 21,
      startDate: '2026-09-01T00:00:00Z',
      endDate: '2026-09-22T23:59:59Z',
      status: 'active',
      founderCommitment: { type: 'hours', value: 30 },
      lastActivityAt: '2026-09-11T18:00:00Z',
      executionScore: 78
    },
    {
      _id: sprint2Id,
      startupId: startup2Id,
      durationDays: 30,
      startDate: '2026-08-05T00:00:00Z',
      endDate: '2026-09-04T23:59:59Z',
      status: 'completed',
      founderCommitment: { type: 'deposit', value: 50000 },
      lastActivityAt: '2026-09-04T22:00:00Z',
      executionScore: 89
    }
  ];
  await sprintsCol.insertMany(sprints);

  // 4. Seed Departments (8 default departments for KubeScale)
  const defaultDeptNames = [
    'Development',
    'Marketing',
    'Design (UI/UX)',
    'Product/Management',
    'Sales',
    'Customer Support',
    'Operations',
    'Finance'
  ];

  const deptDocs: DepartmentDoc[] = [];
  let devDeptId = '';
  let designDeptId = '';

  for (const name of defaultDeptNames) {
    const dId = `dept_${startup1Id}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    let memberIds: string[] = [alexFounderId];
    if (name === 'Development') {
      memberIds.push(priyaDevId);
      devDeptId = dId;
    } else if (name.includes('Design')) {
      memberIds.push(marcusDevId);
      designDeptId = dId;
    }
    deptDocs.push({
      _id: dId,
      startupId: startup1Id,
      sprintId: sprint1Id,
      name,
      memberIds,
      description: `${name} department for KubeScale AI execution sprint.`
    });
  }

  // Also seed for NeuroFlow
  for (const name of defaultDeptNames) {
    const dId = `dept_${startup2Id}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    deptDocs.push({
      _id: dId,
      startupId: startup2Id,
      sprintId: sprint2Id,
      name,
      memberIds: [alexFounderId, priyaDevId, marcusDevId],
      description: `${name} department for NeuroFlow Health.`
    });
  }

  await departmentsCol.insertMany(deptDocs);

  // 5. Seed Tasks for KubeScale
  const tasks: TaskDoc[] = [
    {
      _id: 'tsk_k8s_1',
      departmentId: devDeptId,
      startupId: startup1Id,
      title: 'Build eBPF kernel event listener daemonset',
      description: 'Implement BCC/Cilium-based eBPF tracepoints for process memory allocations and socket latency spikes.',
      assigneeId: priyaDevId,
      assigneeName: 'Priya Sharma',
      priority: 'critical',
      status: 'done',
      contributionPoints: 40,
      dueDate: '2026-09-08',
      completedAt: '2026-09-07T16:00:00Z',
      createdAt: '2026-09-01T10:00:00Z'
    },
    {
      _id: 'tsk_k8s_2',
      departmentId: devDeptId,
      startupId: startup1Id,
      title: 'Implement dynamic pod vertical autoscaler controller',
      description: 'Create custom CRD controller in Go that recalculates CPU limits and requests every 60 seconds.',
      assigneeId: priyaDevId,
      assigneeName: 'Priya Sharma',
      priority: 'high',
      status: 'in_progress',
      contributionPoints: 35,
      dueDate: '2026-09-15',
      createdAt: '2026-09-02T11:00:00Z'
    },
    {
      _id: 'tsk_k8s_3',
      departmentId: devDeptId,
      startupId: startup1Id,
      title: 'Telemetry stream exporter to Prometheus',
      description: 'Format real-time CPU throttling and node headroom statistics into open Prometheus metrics endpoint.',
      priority: 'medium',
      status: 'backlog',
      contributionPoints: 20,
      dueDate: '2026-09-18',
      createdAt: '2026-09-03T14:00:00Z'
    },
    {
      _id: 'tsk_k8s_4',
      departmentId: designDeptId,
      startupId: startup1Id,
      title: 'Design real-time cluster cost telemetry dashboard',
      description: 'Design dark-mode SaaS UI showing live dollar burn-rate vs optimized savings per namespace.',
      assigneeId: marcusDevId,
      assigneeName: 'Marcus Vance',
      priority: 'high',
      status: 'done',
      contributionPoints: 30,
      dueDate: '2026-09-09',
      completedAt: '2026-09-08T18:00:00Z',
      createdAt: '2026-09-01T12:00:00Z'
    },
    {
      _id: 'tsk_k8s_5',
      departmentId: designDeptId,
      startupId: startup1Id,
      title: 'Design onboarding flow & Helm chart wizard',
      description: 'Interactive step-by-step UI for DevOps engineers to paste Helm install commands and verify pod heartbeat.',
      assigneeId: marcusDevId,
      assigneeName: 'Marcus Vance',
      priority: 'medium',
      status: 'review',
      contributionPoints: 25,
      dueDate: '2026-09-14',
      createdAt: '2026-09-04T09:00:00Z'
    }
  ];
  await tasksCol.insertMany(tasks);

  // 6. Seed Expenses
  const expenses: ExpenseDoc[] = [
    {
      _id: 'exp_1',
      startupId: startup1Id,
      description: 'AWS GPU Test Clusters & EKS Control Plane',
      amount: 480,
      category: 'infrastructure',
      date: '2026-09-03'
    },
    {
      _id: 'exp_2',
      startupId: startup1Id,
      description: 'Figma Enterprise & Adobe Creative Suite',
      amount: 120,
      category: 'tooling',
      date: '2026-09-05'
    },
    {
      _id: 'exp_3',
      startupId: startup1Id,
      description: 'Domain Registration & Cloudflare Pro',
      amount: 45,
      category: 'infrastructure',
      date: '2026-09-01'
    }
  ];
  await expensesCol.insertMany(expenses);

  // 7. Seed Timeline Events
  const timeline: TimelineEventDoc[] = [
    {
      _id: 'tml_1',
      startupId: startup1Id,
      eventType: 'readiness_gate_passed',
      actorId: alexFounderId,
      actorName: 'Alex Rivera',
      details: 'Passed readiness gate with verified problem statement and validation LOIs.',
      createdAt: '2026-08-31T15:00:00Z'
    },
    {
      _id: 'tml_2',
      startupId: startup1Id,
      eventType: 'sprint_started',
      actorId: alexFounderId,
      actorName: 'Alex Rivera',
      details: 'Initiated 21-day execution sprint with 30 hrs/wk commitment. 8 departments provisioned.',
      createdAt: '2026-09-01T00:00:00Z'
    },
    {
      _id: 'tml_3',
      startupId: startup1Id,
      departmentId: devDeptId,
      eventType: 'joined',
      actorId: priyaDevId,
      actorName: 'Priya Sharma',
      details: 'Joined Development department as Lead Systems Engineer.',
      createdAt: '2026-09-01T09:30:00Z'
    },
    {
      _id: 'tml_4',
      startupId: startup1Id,
      departmentId: devDeptId,
      eventType: 'task_committed',
      actorId: priyaDevId,
      actorName: 'Priya Sharma',
      details: 'Completed task: "Build eBPF kernel event listener daemonset" (+40 contribution points).',
      createdAt: '2026-09-07T16:00:00Z'
    }
  ];
  await timelineCol.insertMany(timeline);

  // 8. Seed Application
  const applications: ApplicationDoc[] = [
    {
      _id: 'app_1',
      startupId: startup1Id,
      startupName: 'KubeScale AI',
      departmentId: devDeptId,
      departmentName: 'Development',
      developerId: priyaDevId,
      developerName: 'Priya Sharma',
      developerEmail: 'priya@builder.dev',
      coverNote: 'Excited about eBPF and runtime observability. Have built similar custom controllers in past roles.',
      resumeUrl: 'https://files.foundershub.dev/resumes/priya-sharma-resume.pdf',
      answers: {
        'What is your experience with Kubernetes controllers?': '4 years writing custom CRD operators in Go and testing with Kind.',
        'Weekly hours available?': '20 hours during sprint window.'
      },
      status: 'accepted',
      appliedAt: '2026-09-01T08:00:00Z'
    }
  ];
  await applicationsCol.insertMany(applications);

  // 9. Seed Funding Request for NeuroFlow (Sprint Completed)
  const funding: FundingRequestDoc[] = [
    {
      _id: 'fnd_1',
      startupId: startup2Id,
      startupName: 'NeuroFlow Health',
      investorId: vikramInvestorId,
      investorName: 'Vikram Mehta',
      type: 'investment',
      amount: 250000,
      message: 'Impressed by the 89 Execution Score and clinical trial completion. Ready to syndicate the seed round.',
      contactDetails: 'vikram@capital.vc / +91-98200-11223',
      agreementAccepted: true,
      status: 'accepted',
      razorpayOrderId: 'order_test_988214',
      razorpayPaymentId: 'pay_test_988214_success',
      paymentStatus: 'success',
      platformFeeAmount: 2500, // 1% platform fee
      requestedAt: '2026-09-05T14:00:00Z',
      processedAt: '2026-09-06T10:00:00Z'
    }
  ];
  await fundingCol.insertMany(funding);

  console.log('[Seed] Database successfully populated with realistic execution data.');
}
