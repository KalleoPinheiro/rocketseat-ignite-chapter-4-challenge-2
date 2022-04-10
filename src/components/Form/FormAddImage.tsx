import { Box, Button, Stack, useToast } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { api } from '../../services/api';
import { FileInput } from '../Input/FileInput';
import { TextInput } from '../Input/TextInput';

interface FormAddImageProps {
  closeModal: () => void;
}

type Image = {
  title: string;
  description: string;
  url: string;
};

export function FormAddImage({ closeModal }: FormAddImageProps): JSX.Element {
  const [imageUrl, setImageUrl] = useState('');
  const [localImageUrl, setLocalImageUrl] = useState('');
  const toast = useToast();

  const formatBytes = (bytes: number, decimals = 2): number => {
    if (bytes === 0) return 0;

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / k ** i).toFixed(dm));
  };

  const formValidations = {
    image: {
      required: 'Arquivo obrigatório',
      validate: {
        lessThan10MB: v =>
          formatBytes(Number(v[0]?.size)) > 10 ||
          'O arquivo deve ser menor que 10MB',
        acceptedFormats: v =>
          /image\/(jpeg|png|gif)/g.test(v[0]?.type) ||
          'Somente são aceitos arquivos PNG, JPEG e GIF',
      },
    },
    title: {
      required: 'Título obrigatório',
      minLength: {
        value: 2,
        message: 'Mínimo de 2 caracteres',
      },
      maxLength: {
        value: 20,
        message: 'Máximo de 20 caracteres',
      },
    },
    description: {
      required: 'Descrição obrigatória',
      maxLength: {
        value: 65,
        message: 'Máximo de 65 caracteres',
      },
    },
  };

  const queryClient = useQueryClient();
  const mutation = useMutation(
    (formData: Image) => {
      return api.post<Image>('/api/images', formData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('images');
      },
      onError: () => console.error('deu ruim!'),
    }
  );

  const { register, handleSubmit, reset, formState, setError, trigger } =
    useForm();

  const { errors } = formState;

  const onSubmit = async (data: Record<string, unknown>): Promise<void> => {
    try {
      if (!imageUrl) {
        toast({
          status: 'error',
          duration: 5000,
          isClosable: true,
          title: 'Error',
          description: 'Falha ao salvar imagem',
        });
        return;
      }
      await mutation.mutateAsync({
        title: `${data.title}`,
        description: `${data.description}`,
        url: imageUrl,
      });
      toast({
        status: 'success',
        duration: 5000,
        isClosable: true,
        title: 'Sucesso',
        description: 'Imagem salva com sucesso',
      });
    } catch {
      toast({
        status: 'error',
        duration: 5000,
        isClosable: true,
        title: 'Error',
        description: 'Falha ao salvar imagem',
      });
    } finally {
      reset();
      setLocalImageUrl('');
      setImageUrl('');
      closeModal();
    }
  };

  return (
    <Box as="form" width="100%" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        <FileInput
          setImageUrl={setImageUrl}
          localImageUrl={localImageUrl}
          setLocalImageUrl={setLocalImageUrl}
          setError={setError}
          trigger={trigger}
          {...register('image', formValidations.image)}
          error={errors.image}
        />

        <TextInput
          placeholder="Título da imagem..."
          {...register('title', formValidations.title)}
          error={errors.title}
        />

        <TextInput
          placeholder="Descrição da imagem..."
          {...register('description', formValidations.description)}
          error={errors.description}
        />
      </Stack>

      <Button
        my={6}
        isLoading={formState.isSubmitting}
        isDisabled={formState.isSubmitting}
        type="submit"
        w="100%"
        py={6}
      >
        Enviar
      </Button>
    </Box>
  );
}
