import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfilePage } from "@/components/routes/profile-page";
import { JsonLd } from "@/components/seo/json-ld";
import { profileJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { ServerApiError, getProfile } from "@/lib/server/api";
import { profilePath } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

const FALLBACK_IMAGE = "/brand/logo-lockup-768x553.png";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: member } = await getProfile(slug);
    const canonical = profilePath(member.slug || String(member.id));
    const description = member.bio?.replace(/\s+/g, " ").slice(0, 158).trim()
      || `${member.name} shares free items with neighbours on Gratis Castle in Nigeria.`;

    return {
      title: `${member.name} — Free items giver`,
      description,
      alternates: { canonical },
      openGraph: {
        type: "profile",
        url: canonical,
        title: `${member.name} — Gratis Castle`,
        description,
        images: member.avatar_url ? [{ url: member.avatar_url }] : [{ url: FALLBACK_IMAGE, width: 768, height: 553 }],
      },
      twitter: {
        card: "summary",
        title: `${member.name} — Gratis Castle`,
        description,
      },
    };
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) {
      return { title: "Member not found", robots: { index: false, follow: false } };
    }
    throw error;
  }
}

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      {params.then(({ slug }) => <ProfilePageWithJsonLd slug={slug} />)}
    </Suspense>
  );
}

async function ProfilePageWithJsonLd({ slug }: { slug: string }) {
  const member = await getProfile(slug)
    .then(({ data }) => data)
    .catch(() => null);

  if (!member) return <ProfilePage slug={slug} />;

  return (
    <>
      <ProfilePage slug={slug} />
      <JsonLd data={profileJsonLd(member)} />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Community", url: "/community" },
        { name: member.name, url: profilePath(member.slug) },
      ])} />
    </>
  );
}

function ProfileSkeleton() {
  return <div className="container-page py-10"><div className="h-40 w-full animate-pulse rounded-2xl bg-muted" /></div>;
}
