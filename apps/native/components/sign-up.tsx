import { useForm } from "@tanstack/react-form";
import {
  Button,
  FieldError,
  Input,
  Label,
  Spinner,
  Surface,
  TextField,
  useToast,
} from "heroui-native";
import { useRef } from "react";
import { Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/orpc";

const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z
    .string()
    .trim()
    .min(1, "Email é obrigatório")
    .email("Insira um email válido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(8, "Use pelo menos 8 caracteres"),
});

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (Array.isArray(error)) {
    for (const issue of error) {
      const message = getErrorMessage(issue);
      if (message) return message;
    }
    return null;
  }
  if (typeof error === "object" && error !== null) {
    const maybeError = error as { message?: unknown };
    if (typeof maybeError.message === "string") return maybeError.message;
  }
  return null;
}

export function SignUp() {
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    validators: { onSubmit: signUpSchema },
    onSubmit: async ({ value, formApi }) => {
      await authClient.signUp.email(
        {
          name: value.name.trim(),
          email: value.email.trim(),
          password: value.password,
        },
        {
          onError(error) {
            toast.show({
              variant: "danger",
              label: error.error?.message || "Falha ao criar conta",
            });
          },
          onSuccess() {
            formApi.reset();
            toast.show({
              variant: "success",
              label: "Conta criada com sucesso!",
            });
          },
        },
      );
    },
  });

  return (
    <Animated.View entering={FadeInDown.duration(600).springify()}>
      <Surface
        variant="secondary"
        className="p-6 rounded-3xl border border-border bg-card"
      >
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-foreground text-xl font-bold">
            Crie sua conta
          </Text>
          <Text className="text-muted-foreground text-sm mt-1">
            Comece a rastrear sua alimentação
          </Text>
        </View>

        <form.Subscribe
          selector={(state) => ({
            isSubmitting: state.isSubmitting,
            validationError: getErrorMessage(state.errorMap.onSubmit),
          })}
        >
          {({ isSubmitting, validationError }) => (
            <>
              {validationError && (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <FieldError isInvalid className="mb-4">
                    {validationError}
                  </FieldError>
                </Animated.View>
              )}

              <View className="gap-4">
                <form.Field name="name">
                  {(field) => (
                    <TextField>
                      <Label>Nome</Label>
                      <Input
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChangeText={field.handleChange}
                        placeholder="Seu nome"
                        autoComplete="name"
                        textContentType="name"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => emailInputRef.current?.focus()}
                      />
                    </TextField>
                  )}
                </form.Field>

                <form.Field name="email">
                  {(field) => (
                    <TextField>
                      <Label>Email</Label>
                      <Input
                        ref={emailInputRef}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChangeText={field.handleChange}
                        placeholder="email@exemplo.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() =>
                          passwordInputRef.current?.focus()
                        }
                      />
                    </TextField>
                  )}
                </form.Field>

                <form.Field name="password">
                  {(field) => (
                    <TextField>
                      <Label>Senha</Label>
                      <Input
                        ref={passwordInputRef}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChangeText={field.handleChange}
                        placeholder="••••••••"
                        secureTextEntry
                        autoComplete="new-password"
                        textContentType="newPassword"
                        returnKeyType="go"
                        onSubmitEditing={form.handleSubmit}
                      />
                    </TextField>
                  )}
                </form.Field>

                <Button
                  size="lg"
                  onPress={form.handleSubmit}
                  isDisabled={isSubmitting}
                  className="mt-2 h-14 bg-primary"
                >
                  {isSubmitting ? (
                    <Spinner size="sm" color="default" />
                  ) : (
                    <Button.Label className="text-base font-bold">
                      Criar Conta
                    </Button.Label>
                  )}
                </Button>
              </View>
            </>
          )}
        </form.Subscribe>
      </Surface>
    </Animated.View>
  );
}
