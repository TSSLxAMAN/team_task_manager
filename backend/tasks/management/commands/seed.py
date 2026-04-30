"""
python manage.py seed          — create demo data (skips if already seeded)
python manage.py seed --flush  — wipe all app data first, then re-seed
"""
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User
from projects.models import Project
from tasks.models import Task


TODAY = date.today()

def d(offset):
    return TODAY + timedelta(days=offset)


USERS = [
    dict(email='admin@teamflow.com',  name='Rahul Sharma',  role='admin',  password='admin1234'),
    dict(email='aman@teamflow.com',   name='Aman Kumar',    role='member', password='test1234'),
    dict(email='priya@teamflow.com',  name='Priya Singh',   role='member', password='test1234'),
    dict(email='maya@teamflow.com',   name='Maya Patel',    role='member', password='test1234'),
    dict(email='arjun@teamflow.com',  name='Arjun Mehta',   role='member', password='test1234'),
]

PROJECTS = [
    dict(
        name='App Redesign',
        description='Full UI overhaul — new design system, component library, dark mode.',
        color='#D97706',
        member_emails=['aman@teamflow.com', 'priya@teamflow.com', 'maya@teamflow.com', 'arjun@teamflow.com'],
    ),
    dict(
        name='Mobile Auth',
        description='OAuth2, biometric login, token refresh, and session hardening.',
        color='#2563EB',
        member_emails=['aman@teamflow.com', 'priya@teamflow.com', 'arjun@teamflow.com'],
    ),
    dict(
        name='API v2 Migration',
        description='Breaking changes to REST API — versioning, pagination, rate limiting.',
        color='#16A34A',
        member_emails=['maya@teamflow.com', 'arjun@teamflow.com'],
    ),
]


class Command(BaseCommand):
    help = 'Seed the database with realistic demo data'

    def add_arguments(self, parser):
        parser.add_argument('--flush', action='store_true', help='Delete all existing app data before seeding')

    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write('Flushing existing data…')
            Task.objects.all().delete()
            Project.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.WARNING('All app data deleted.'))

        # ── Users ──────────────────────────────────────────────
        self.stdout.write('Creating users…')
        users = {}
        for u in USERS:
            obj, created = User.objects.get_or_create(
                email=u['email'],
                defaults=dict(name=u['name'], role=u['role'])
            )
            if created:
                obj.set_password(u['password'])
                obj.save()
                self.stdout.write(f"  + {obj.name} ({obj.role})")
            else:
                self.stdout.write(f"  ~ {obj.name} already exists")
            users[u['email']] = obj

        admin = users['admin@teamflow.com']
        aman  = users['aman@teamflow.com']
        priya = users['priya@teamflow.com']
        maya  = users['maya@teamflow.com']
        arjun = users['arjun@teamflow.com']

        # ── Projects ───────────────────────────────────────────
        self.stdout.write('Creating projects…')
        projs = {}
        for pd in PROJECTS:
            proj, created = Project.objects.get_or_create(
                name=pd['name'],
                defaults=dict(description=pd['description'], color=pd['color'], created_by=admin)
            )
            proj.members.set([users[e] for e in pd['member_emails']] + [admin])
            if created:
                self.stdout.write(f"  + {proj.name}")
            else:
                self.stdout.write(f"  ~ {proj.name} already exists")
            projs[pd['name']] = proj

        redesign = projs['App Redesign']
        mobile   = projs['Mobile Auth']
        api_v2   = projs['API v2 Migration']

        if Task.objects.filter(project=redesign).exists():
            self.stdout.write(self.style.WARNING('Tasks already seeded — skipping task creation. Use --flush to reset.'))
            self._print_credentials()
            return

        # ── App Redesign tasks ─────────────────────────────────
        self.stdout.write('Creating tasks for App Redesign…')

        # 1. In Progress — started, has elapsed time
        t1 = Task.objects.create(
            project=redesign, title='Fix login bug on mobile',
            description='Safari WebKit regression breaks the login form submit on iOS 17.',
            priority='high', status='in_progress',
            assigned_to=aman, created_by=admin,
            estimate_hours=3, due_date=d(0),
            started_at=timezone.now() - timedelta(hours=2),
            elapsed_seconds=7200,
        )

        # 2. Under Review — has MR link + notes
        t2 = Task.objects.create(
            project=redesign, title='Build new dashboard layout',
            description='Implement the new grid-based dashboard with widget slots.',
            priority='high', status='under_review',
            assigned_to=priya, created_by=admin,
            estimate_hours=8, due_date=d(2),
            mr_link='https://github.com/org/teamflow/pull/42',
            completion_notes='All components done. Responsive breakpoints tested on Chrome + Firefox.',
            elapsed_seconds=27000,
        )

        # 3. Todo — parent task (has subtasks)
        t3 = Task.objects.create(
            project=redesign, title='Write API documentation',
            description='Cover all REST endpoints with request/response examples.',
            priority='medium', status='todo',
            assigned_to=aman, created_by=admin,
            estimate_hours=6, due_date=d(3),
        )
        # 3a. Subtask
        Task.objects.create(
            project=redesign, title='Auth section docs',
            description='Document login, register, token refresh endpoints.',
            priority='medium', status='todo',
            assigned_to=aman, created_by=admin,
            estimate_hours=2, due_date=d(3),
            parent=t3,
        )
        # 3b. Subtask
        Task.objects.create(
            project=redesign, title='Tasks endpoint docs',
            description='Document CRUD + status-transition endpoints for tasks.',
            priority='medium', status='todo',
            assigned_to=maya, created_by=admin,
            estimate_hours=2, due_date=d(4),
            parent=t3,
        )

        # 4. Done
        t4 = Task.objects.create(
            project=redesign, title='Add dark mode support',
            description='CSS variable swap + localStorage persistence.',
            priority='medium', status='done',
            assigned_to=priya, created_by=admin,
            estimate_hours=5, due_date=d(-6),
            mr_link='https://github.com/org/teamflow/pull/38',
            completion_notes='Used prefers-color-scheme media query as fallback.',
            elapsed_seconds=15600,
            completed_at=timezone.now() - timedelta(days=6),
        )

        # 5. Done
        Task.objects.create(
            project=redesign, title='Replace icon set',
            description='Swap Heroicons v1 for Lucide React across all components.',
            priority='low', status='done',
            assigned_to=maya, created_by=admin,
            estimate_hours=3, due_date=d(-8),
            mr_link='https://github.com/org/teamflow/pull/35',
            completion_notes='470 icons replaced. Bundle size reduced by 12 kB.',
            elapsed_seconds=9800,
            completed_at=timezone.now() - timedelta(days=8),
        )

        # 6. Done — parent task
        t6 = Task.objects.create(
            project=redesign, title='Settings page',
            description='User profile, notifications, and security settings tabs.',
            priority='medium', status='done',
            assigned_to=maya, created_by=admin,
            estimate_hours=6, due_date=d(-10),
            mr_link='https://github.com/org/teamflow/pull/31',
            completion_notes='All three tabs implemented with live save.',
            elapsed_seconds=19400,
            completed_at=timezone.now() - timedelta(days=10),
        )
        # 6a. Done subtask
        Task.objects.create(
            project=redesign, title='Notification preferences',
            description='Email + in-app toggle per event type.',
            priority='low', status='done',
            assigned_to=priya, created_by=admin,
            estimate_hours=2, due_date=d(-11),
            mr_link='https://github.com/org/teamflow/pull/32',
            completion_notes='Persisted to user profile.',
            elapsed_seconds=6200,
            completed_at=timezone.now() - timedelta(days=11),
            parent=t6,
        )

        # 7. Todo
        Task.objects.create(
            project=redesign, title='Search bar UX',
            description='Keyboard shortcut (Cmd+K), fuzzy search, recent items.',
            priority='medium', status='todo',
            assigned_to=aman, created_by=admin,
            estimate_hours=5, due_date=d(6),
        )

        # 8. Todo
        Task.objects.create(
            project=redesign, title='Onboarding tour',
            description='Step-by-step product tour for new users using a tooltip library.',
            priority='low', status='todo',
            assigned_to=maya, created_by=admin,
            estimate_hours=4, due_date=d(8),
        )

        # 9. Sent Back
        Task.objects.create(
            project=redesign, title='Performance audit',
            description='Lighthouse CI integration and Core Web Vitals baseline.',
            priority='high', status='sent_back',
            assigned_to=arjun, created_by=admin,
            estimate_hours=8, due_date=d(4),
            mr_link='https://github.com/org/teamflow/pull/45',
            completion_notes='Added Lighthouse CI config.',
            send_back_reason='LCP is still 4.2s on mobile — needs image lazy-loading and font preload before this can be merged.',
            elapsed_seconds=11000,
        )

        # 10. Overdue todo (due in past)
        Task.objects.create(
            project=redesign, title='Accessibility audit',
            description='WCAG 2.1 AA compliance check — focus traps, aria labels, color contrast.',
            priority='high', status='todo',
            assigned_to=arjun, created_by=admin,
            estimate_hours=6, due_date=d(-3),
        )

        # ── Mobile Auth tasks ──────────────────────────────────
        self.stdout.write('Creating tasks for Mobile Auth…')

        m1 = Task.objects.create(
            project=mobile, title='OAuth2 integration',
            description='Google + GitHub OAuth2 via allauth social accounts.',
            priority='high', status='in_progress',
            assigned_to=priya, created_by=admin,
            estimate_hours=10, due_date=d(5),
            started_at=timezone.now() - timedelta(hours=5),
            elapsed_seconds=18000,
        )

        Task.objects.create(
            project=mobile, title='Google sign-in button',
            description='Material Design button, loading state, error toast.',
            priority='medium', status='todo',
            assigned_to=aman, created_by=admin,
            estimate_hours=3, due_date=d(6),
            parent=m1,
        )

        Task.objects.create(
            project=mobile, title='GitHub OAuth callback',
            description='Handle redirect URI, exchange code for token.',
            priority='medium', status='todo',
            assigned_to=arjun, created_by=admin,
            estimate_hours=3, due_date=d(6),
            parent=m1,
        )

        Task.objects.create(
            project=mobile, title='Biometric auth',
            description='Face ID / fingerprint via WebAuthn on supported devices.',
            priority='high', status='under_review',
            assigned_to=aman, created_by=admin,
            estimate_hours=8, due_date=d(7),
            mr_link='https://github.com/org/teamflow/pull/51',
            completion_notes='Works on iOS Safari 17 and Android Chrome. Desktop fallback is password prompt.',
            elapsed_seconds=24000,
        )

        Task.objects.create(
            project=mobile, title='Token refresh logic',
            description='Silent refresh 60s before access token expiry using interceptor.',
            priority='high', status='done',
            assigned_to=arjun, created_by=admin,
            estimate_hours=4, due_date=d(-5),
            mr_link='https://github.com/org/teamflow/pull/48',
            completion_notes='Axios interceptor queues requests during refresh to avoid race conditions.',
            elapsed_seconds=12600,
            completed_at=timezone.now() - timedelta(days=5),
        )

        Task.objects.create(
            project=mobile, title='Session management',
            description='Device list, revoke all sessions, remember-me cookie.',
            priority='medium', status='todo',
            assigned_to=maya, created_by=admin,
            estimate_hours=6, due_date=d(10),
        )

        Task.objects.create(
            project=mobile, title='Security audit',
            description='Pen-test auth flows, check CSRF tokens, verify HTTPS-only cookies.',
            priority='high', status='sent_back',
            assigned_to=priya, created_by=admin,
            estimate_hours=5, due_date=d(2),
            mr_link='https://github.com/org/teamflow/pull/53',
            completion_notes='Ran OWASP ZAP scan — no critical findings.',
            send_back_reason='Need to add brute-force lockout test (>10 failed logins) and verify rate limiting headers before approval.',
            elapsed_seconds=14400,
        )

        # ── API v2 Migration tasks ─────────────────────────────
        self.stdout.write('Creating tasks for API v2 Migration…')

        Task.objects.create(
            project=api_v2, title='Design versioning strategy',
            description='URL prefix /v2/ vs Accept header — document decision and trade-offs.',
            priority='high', status='done',
            assigned_to=maya, created_by=admin,
            estimate_hours=3, due_date=d(-14),
            mr_link='https://github.com/org/teamflow/pull/22',
            completion_notes='Decided on URL prefix. ADR written.',
            elapsed_seconds=8800,
            completed_at=timezone.now() - timedelta(days=14),
        )

        Task.objects.create(
            project=api_v2, title='Cursor-based pagination',
            description='Replace page-number pagination with cursor pagination for large datasets.',
            priority='high', status='in_progress',
            assigned_to=arjun, created_by=admin,
            estimate_hours=6, due_date=d(4),
            started_at=timezone.now() - timedelta(hours=3),
            elapsed_seconds=10800,
        )

        Task.objects.create(
            project=api_v2, title='Rate limiting middleware',
            description='Per-user 100 req/min limit using django-ratelimit or DRF throttling.',
            priority='medium', status='todo',
            assigned_to=maya, created_by=admin,
            estimate_hours=4, due_date=d(9),
        )

        Task.objects.create(
            project=api_v2, title='Deprecation notices',
            description='Add Sunset + Deprecation response headers to all v1 endpoints.',
            priority='low', status='todo',
            assigned_to=arjun, created_by=admin,
            estimate_hours=2, due_date=d(12),
        )

        Task.objects.create(
            project=api_v2, title='Migration guide docs',
            description='Write v1 → v2 migration guide with code diffs and a changelog.',
            priority='medium', status='todo',
            assigned_to=maya, created_by=admin,
            estimate_hours=5, due_date=d(14),
        )

        self.stdout.write(self.style.SUCCESS('\nSeed complete!\n'))
        self._print_credentials()

    def _print_credentials(self):
        self.stdout.write('─' * 46)
        self.stdout.write('Login credentials:')
        self.stdout.write('─' * 46)
        creds = [
            ('admin@teamflow.com',  'admin1234', 'Admin'),
            ('aman@teamflow.com',   'test1234',  'Member'),
            ('priya@teamflow.com',  'test1234',  'Member'),
            ('maya@teamflow.com',   'test1234',  'Member'),
            ('arjun@teamflow.com',  'test1234',  'Member'),
        ]
        for email, pw, role in creds:
            self.stdout.write(f"  {role:<8} {email:<28} {pw}")
        self.stdout.write('─' * 46)
