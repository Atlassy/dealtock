
import React from 'https';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from 'npm:@react-email/components@0.0.22';

interface MagicLinkEmailProps {
  email_action_type: 'magiclink' | 'recovery' | 'signup' | 'invite';
  supabase_url: string;
  redirect_to: string;
  user_email: string;
  locale: 'fr' | 'ar' | 'en';
}

const content = {
  fr: {
    preview: {
      magiclink: 'Connectez-vous à Dealtock',
      recovery: 'Réinitialisez votre mot de passe Dealtock',
      signup: 'Bienvenue sur Dealtock',
      invite: 'Invitation à rejoindre Dealtock',
    },
    title: {
      magiclink: 'Votre lien de connexion magique',
      recovery: 'Réinitialisez votre mot de passe',
      signup: 'Confirmez votre adresse e-mail',
      invite: 'Vous avez été invité !',
    },
    intro: {
      magiclink: 'Cliquez sur le bouton ci-dessous pour vous connecter à votre compte Dealtock.',
      recovery: 'Quelqu\'un a demandé une réinitialisation de mot de passe pour votre compte. Si ce n\'est pas vous, ignorez cet e-mail.',
      signup: 'Merci de vous être inscrit ! Cliquez sur le bouton ci-dessous pour confirmer votre adresse e-mail.',
      invite: 'Vous avez été invité à rejoindre Dealtock. Cliquez ci-dessous pour commencer.',
    },
    buttonText: {
      magiclink: 'Se connecter',
      recovery: 'Réinitialiser le mot de passe',
      signup: 'Confirmer l\'e-mail',
      invite: 'Accepter l\'invitation',
    },
    outro: 'Si vous n\'avez pas demandé cet e-mail, vous pouvez l\'ignorer en toute sécurité.',
    footer: '© 2025 Dealtock. Tous droits réservés.',
  },
  en: {
    preview: {
      magiclink: 'Log in to Dealtock',
      recovery: 'Reset your Dealtock password',
      signup: 'Welcome to Dealtock',
      invite: 'Invitation to join Dealtock',
    },
    title: {
      magiclink: 'Your Magic Login Link',
      recovery: 'Reset Your Password',
      signup: 'Confirm Your Email Address',
      invite: 'You\'ve Been Invited!',
    },
    intro: {
      magiclink: 'Click the button below to log in to your Dealtock account.',
      recovery: 'Someone requested a password reset for your account. If this wasn\'t you, please ignore this email.',
      signup: 'Thanks for signing up! Click the button below to confirm your email address.',
      invite: 'You have been invited to join Dealtock. Click below to get started.',
    },
    buttonText: {
      magiclink: 'Log In',
      recovery: 'Reset Password',
      signup: 'Confirm Email',
      invite: 'Accept Invitation',
    },
    outro: 'If you did not request this email, you can safely ignore it.',
    footer: '© 2025 Dealtock. All rights reserved.',
  },
  ar: {
    preview: {
      magiclink: 'تسجيل الدخول إلى Dealtock',
      recovery: 'إعادة تعيين كلمة المرور الخاصة بك في Dealtock',
      signup: 'مرحبًا بك في Dealtock',
      invite: 'دعوة للانضمام إلى Dealtock',
    },
    title: {
      magiclink: 'رابط الدخول السحري الخاص بك',
      recovery: 'إعادة تعيين كلمة المرور',
      signup: 'تأكيد عنوان بريدك الإلكتروني',
      invite: 'لقد تمت دعوتك!',
    },
    intro: {
      magiclink: 'انقر على الزر أدناه لتسجيل الدخول إلى حسابك في Dealtock.',
      recovery: 'طلب شخص ما إعادة تعيين كلمة المرور لحسابك. إذا لم تكن أنت، يرجى تجاهل هذا البريد الإلكتروني.',
      signup: 'شكرًا لتسجيلك! انقر على الزر أدناه لتأكيد عنوان بريدك الإلكتروني.',
      invite: 'لقد تمت دعوتك للانضمام إلى Dealtock. انقر أدناه للبدء.',
    },
    buttonText: {
      magiclink: 'تسجيل الدخول',
      recovery: 'إعادة تعيين كلمة المرور',
      signup: 'تأكيد البريد الإلكتروني',
      invite: 'قبول الدعوة',
    },
    outro: 'إذا لم تطلب هذا البريد الإلكتروني، يمكنك تجاهله بأمان.',
    footer: '© 2025 Dealtock. جميع الحقوق محفوظة.',
  },
};

const baseUrl = 'https://dealtock.pro';
const logoUrl = 'https://res.cloudinary.com/dealtock/image/upload/v1722863444/dealtock-logo_p2tdgw.png';

export const MagicLinkEmail = ({
  email_action_type = 'magiclink',
  supabase_url,
  user_email,
  locale = 'fr',
}: MagicLinkEmailProps) => {
  const langContent = content[locale] || content.en;
  const isRtl = locale === 'ar';

  return (
    <Html>
      <Head />
      <Preview>{langContent.preview[email_action_type]}</Preview>
      <Tailwind>
        <Body className="bg-slate-900 text-white font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
          <Container className="p-8 rounded-lg shadow-lg max-w-xl mx-auto bg-slate-800 border border-slate-700 my-8">
            <Section className="text-center">
              <Img src={logoUrl} width="150" alt="Dealtock Logo" className="mx-auto" />
            </Section>
            <Heading className="text-2xl font-bold text-center mt-6 text-gradient">
              {langContent.title[email_action_type]}
            </Heading>
            <Section className="mt-6">
              <Text className="text-gray-300 text-base leading-relaxed">
                {langContent.intro[email_action_type]}
              </Text>
            </Section>
            <Section className="text-center mt-8">
              <Button
                className="bg-indigo-600 text-white font-semibold rounded-md py-3 px-8 text-base"
                href={supabase_url}
              >
                {langContent.buttonText[email_action_type]}
              </Button>
            </Section>
            <Text className="text-gray-400 text-sm mt-8">
              {langContent.outro}
            </Text>
            <Text className="text-gray-500 text-xs mt-8 pt-4 border-t border-slate-700 text-center">
              {langContent.footer}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default MagicLinkEmail;
